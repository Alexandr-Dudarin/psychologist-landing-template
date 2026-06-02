import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../helpers/http";

const { poolQueryMock, requireAdminRequestMock } = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  requireAdminRequestMock: vi.fn(),
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
}));

vi.mock("../../server/auth/requireAdmin", () => ({
  requireAdminRequest: requireAdminRequestMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type RequestRow = {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  source: string;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
  created_at: string;
  client_id: number | string | null;
};

function requestRow(overrides: Partial<RequestRow> = {}): RequestRow {
  return {
    id: "301",
    name: "Irina Petrova",
    phone: "+79189990099",
    email: "irina@example.com",
    message: "Need a first consultation",
    status: "replied",
    source: "website",
    preferred_contact_method: "telegram",
    preferred_contact_value: "@irina_test",
    created_at: "2027-04-01T09:00:00.000Z",
    client_id: "501",
    ...overrides,
  };
}

function createMockDb(rows: RequestRow[] = []) {
  const queryLog: QueryLogEntry[] = [];

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql.includes("FROM requests")) {
      return { rows };
    }

    if (sql.includes("UPDATE requests")) {
      return {
        rows: [
          {
            id: 301,
            status: "completed",
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return { queryLog };
}

async function loadRequestsHandler() {
  const module = await import("../../api/admin/requests");
  return module.default;
}

describe("admin requests API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
  });

  it("lists requests with the current response shape and normalized numeric fields", async () => {
    const { queryLog } = createMockDb([
      requestRow(),
      requestRow({
        id: "302",
        name: "Unknown Status",
        phone: "+79181112233",
        email: "unknown@example.com",
        message: "",
        status: "legacy-status",
        source: "manual",
        preferred_contact_method: null,
        preferred_contact_value: null,
        created_at: "2027-04-02T10:00:00.000Z",
        client_id: null,
      }),
    ]);

    const handler = await loadRequestsHandler();
    const res = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 301,
          name: "Irina Petrova",
          phone: "+79189990099",
          email: "irina@example.com",
          message: "Need a first consultation",
          status: "replied",
          source: "website",
          preferredContactMethod: "telegram",
          preferredContactValue: "@irina_test",
          createdAt: "2027-04-01T09:00:00.000Z",
          clientId: 501,
        },
        {
          id: 302,
          name: "Unknown Status",
          phone: "+79181112233",
          email: "unknown@example.com",
          message: "",
          status: "new",
          source: "manual",
          preferredContactMethod: null,
          preferredContactValue: null,
          createdAt: "2027-04-02T10:00:00.000Z",
          clientId: null,
        },
      ],
    });
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].sql).toContain("FROM requests");
    expect(queryLog[0].sql).toContain("ORDER BY r.created_at DESC");
    expect(queryLog[0].values).toEqual([]);
  });

  it("applies implemented status and search filters to the list query", async () => {
    const { queryLog } = createMockDb([]);

    const handler = await loadRequestsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "GET",
        query: {
          status: "booked",
          search: "  Irina  ",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].values).toEqual(["booked", "%Irina%"]);
    expect(queryLog[0].sql).toContain("r.status = $1");
    expect(queryLog[0].sql).toContain("ILIKE $2");
  });

  it("ignores the all status filter and rejects invalid list status filters", async () => {
    const { queryLog } = createMockDb([]);
    const handler = await loadRequestsHandler();

    const allRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: { status: "all", search: "301" },
      }),
      allRes
    );

    const invalidRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: { status: "archived" },
      }),
      invalidRes
    );

    expect(allRes.statusCode).toBe(200);
    expect(queryLog[0].values).toEqual(["%301%"]);
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.jsonBody).toEqual({ error: "Invalid status filter" });
    expect(queryLog).toHaveLength(1);
  });

  it("supports active and old request scopes with old requests pagination", async () => {
    const { queryLog } = createMockDb([
      requestRow({ id: "301" }),
      requestRow({ id: "302" }),
      requestRow({ id: "303" }),
    ]);

    const handler = await loadRequestsHandler();

    const activeRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: { scope: "active" },
      }),
      activeRes
    );

    const oldRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: {
          scope: "old",
          limit: "2",
          offset: "4",
        },
      }),
      oldRes
    );

    const activeJson = activeRes.jsonBody as {
      items: unknown[];
      hasMore?: boolean;
    };

    const oldJson = oldRes.jsonBody as {
      items: unknown[];
      hasMore?: boolean;
    };

    expect(activeRes.statusCode).toBe(200);
    expect(activeJson.items).toHaveLength(3);
    expect(activeJson).not.toHaveProperty("hasMore");
    expect(queryLog[0].sql).toContain(
      "r.created_at::date > CURRENT_DATE - INTERVAL '32 days'"
    );

    expect(oldRes.statusCode).toBe(200);
    expect(oldJson.items).toHaveLength(2);
    expect(oldJson.hasMore).toBe(true);
    expect(queryLog[1].sql).toContain(
      "r.created_at::date <= CURRENT_DATE - INTERVAL '32 days'"
    );
    expect(queryLog[1].sql).toContain("LIMIT $1");
    expect(queryLog[1].sql).toContain("OFFSET $2");
    expect(queryLog[1].values).toEqual([3, 4]);
  });

  it("rejects invalid request scope and pagination params before DB access", async () => {
    createMockDb();
    const handler = await loadRequestsHandler();

    for (const query of [
      { scope: "archived" },
      { scope: "old", limit: "0" },
      { scope: "old", limit: "-1" },
      { scope: "old", offset: "-1" },
      { scope: "old", offset: "1.5" },
    ]) {
      const res = createMockResponse();

      await handler(
        createMockRequest({
          method: "GET",
          query,
        }),
        res
      );

      expect(res.statusCode).toBe(400);
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("updates request status with validated id and status params", async () => {
    const { queryLog } = createMockDb();

    const handler = await loadRequestsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: JSON.stringify({
          id: "301",
          status: "completed",
        }),
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 301,
        status: "completed",
      },
    });
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].sql).toContain("UPDATE requests");
    expect(queryLog[0].values).toEqual(["completed", 301]);
  });

  it("returns not found when a valid status update has no matching request", async () => {
    const queryLog: QueryLogEntry[] = [];
    poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      queryLog.push({ sql, values });
      return { rows: [] };
    });

    const handler = await loadRequestsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: {
          id: 999,
          status: "cancelled",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toEqual({ error: "Request not found" });
    expect(queryLog[0].values).toEqual(["cancelled", 999]);
  });

  it("rejects invalid update payloads before querying the database", async () => {
    createMockDb();
    const handler = await loadRequestsHandler();

    for (const body of [
      { id: 301, status: "archived" },
      { status: "completed" },
      { id: "not-a-number", status: "completed" },
      "{bad json",
    ]) {
      const res = createMockResponse();

      await handler(
        createMockRequest({
          method: "POST",
          query: { action: "update" },
          body,
        }),
        res
      );

      expect(res.statusCode).toBe(400);
      expect(res.jsonBody).toEqual({ error: "Invalid payload" });
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("handles missing action, unknown action, and unsupported methods without DB access", async () => {
    createMockDb();
    const handler = await loadRequestsHandler();

    for (const req of [
      createMockRequest({ method: "POST" }),
      createMockRequest({
        method: "POST",
        query: { action: "delete" },
      }),
      createMockRequest({
        method: "PUT",
        query: { action: "update" },
        body: {
          id: 301,
          status: "completed",
        },
      }),
    ]) {
      const res = createMockResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(405);
      expect(res.jsonBody).toEqual({ error: "Method not allowed" });
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("blocks unauthorized requests before DB access", async () => {
    createMockDb();
    requireAdminRequestMock.mockImplementation((_req, res) => {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    });

    const handler = await loadRequestsHandler();
    const res = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), res);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: "Unauthorized" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });
});
