import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../helpers/http";

const {
  poolQueryMock,
  processSessionRemindersMock,
  requireAdminRequestMock,
} = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  processSessionRemindersMock: vi.fn(),
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

vi.mock("../../server/reminders/processSessionReminders", () => ({
  processSessionReminders: processSessionRemindersMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type SessionRow = {
  id: string | number;
  client_id: string | number;
  client_name: string;
  service_id: string | number;
  service_title: string;
  scheduled_at: string;
  duration_minutes: number | string;
  price: number | string;
  status: string;
  notes: string;
  source: string;
  client_package_id: string | number | null;
  client_package_code: string | null;
  client_package_title: string | null;
  created_at: string;
};

type SessionOverlapRow = {
  id: string | number;
  client_name: string;
  scheduled_at: string;
  duration_minutes: string | number;
};

type MockDbOptions = {
  listRows?: SessionRow[];
  selectedSession?: SessionRow;
  existingSession?: SessionRow | null;
  insertedSessionId?: number | string;
  updatedSessionId?: number | string | null;
  deletedSessionId?: number | string | null;
  overlap?: SessionOverlapRow | null;
  throwOn?: "list" | "overlap" | "insert" | "update" | "delete";
};

const futureScheduledAt = "2027-06-20T12:00:00.000Z";
const updatedFutureScheduledAt = "2027-06-21T12:00:00.000Z";
const pastScheduledAt = "2020-01-01T10:00:00.000Z";

function sessionRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "901",
    client_id: "501",
    client_name: "Irina Petrova",
    service_id: "7",
    service_title: "Individual consultation",
    scheduled_at: futureScheduledAt,
    duration_minutes: "60",
    price: "5000.50",
    status: "scheduled",
    notes: "Initial session",
    source: "manual",
    client_package_id: null,
    client_package_code: null,
    client_package_title: null,
    created_at: "2027-06-01T09:00:00.000Z",
    ...overrides,
  };
}

function createSessionPayload(overrides: Record<string, unknown> = {}) {
  return {
    clientId: 501,
    serviceId: 7,
    scheduledAt: futureScheduledAt,
    durationMinutes: 60,
    price: 5000.5,
    status: "scheduled",
    notes: " Initial session ",
    clientPackageId: null,
    ...overrides,
  };
}

function updateSessionPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 901,
    clientId: 501,
    serviceId: 7,
    scheduledAt: updatedFutureScheduledAt,
    durationMinutes: 60,
    price: 6000,
    status: "scheduled",
    notes: " Updated session ",
    clientPackageId: null,
    ...overrides,
  };
}

function createQueryMock(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];
  let selectSessionCount = 0;

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql.includes("WITH target")) {
      if (options.throwOn === "overlap") {
        throw new Error("overlap db failure");
      }

      return { rows: options.overlap ? [options.overlap] : [] };
    }

    if (sql.includes("INSERT INTO sessions")) {
      if (options.throwOn === "insert") {
        throw new Error("insert db failure");
      }

      return { rows: [{ id: options.insertedSessionId ?? 901 }] };
    }

    if (sql.includes("UPDATE sessions")) {
      if (options.throwOn === "update") {
        throw new Error("update db failure");
      }

      return {
        rows:
          options.updatedSessionId === null
            ? []
            : [{ id: options.updatedSessionId ?? 901 }],
      };
    }

    if (sql.includes("DELETE FROM sessions")) {
      if (options.throwOn === "delete") {
        throw new Error("delete db failure");
      }

      return {
        rows:
          options.deletedSessionId === null
            ? []
            : [{ id: options.deletedSessionId ?? values?.[0] ?? 901 }],
      };
    }

    if (
      sql.includes("FROM sessions s") &&
      sql.includes("LEFT JOIN client_service_packages") &&
      sql.includes("WHERE s.id = $1")
    ) {
      selectSessionCount += 1;

      if (selectSessionCount === 1 && options.existingSession === null) {
        return { rows: [] };
      }

      if (selectSessionCount === 1 && options.existingSession) {
        return { rows: [options.existingSession] };
      }

      return {
        rows: [
          options.selectedSession ??
            sessionRow({
              id: values?.[0] as string | number,
            }),
        ],
      };
    }

    if (sql.includes("FROM sessions s")) {
      if (options.throwOn === "list") {
        throw new Error("list db failure");
      }

      return { rows: options.listRows ?? [] };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return { queryLog };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

function findQueries(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.filter((entry) => entry.sql.includes(fragment));
}

async function loadSessionsHandler() {
  const module = await import("../../api/admin/sessions");
  return module.default;
}

async function callAdminSessions(
  overrides: Parameters<typeof createMockRequest>[0]
) {
  const handler = await loadSessionsHandler();
  const res = createMockResponse();

  await handler(createMockRequest(overrides), res);

  return res;
}

describe("admin sessions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
    processSessionRemindersMock.mockResolvedValue({
      success: true,
      lockAcquired: true,
      processedAt: "2027-06-01T09:00:00.000Z",
      batches: [],
    });
  });

  it("lists sessions with mapped frontend fields and normalized numeric values", async () => {
    const { queryLog } = createQueryMock({
      listRows: [
        sessionRow(),
        sessionRow({
          id: "902",
          client_id: "502",
          client_name: "Maria Sokolova",
          service_id: "8",
          service_title: "Family therapy",
          duration_minutes: "90",
          price: "0",
          status: "legacy-status",
          notes: "Package-backed session",
          client_package_id: "801",
          client_package_code: "PKGACTIVE01",
          client_package_title: "Package of 4 sessions",
          created_at: "2027-06-02T09:00:00.000Z",
        }),
      ],
    });

    const res = await callAdminSessions({ method: "GET" });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 901,
          clientId: 501,
          clientName: "Irina Petrova",
          serviceId: 7,
          serviceTitle: "Individual consultation",
          scheduledAt: futureScheduledAt,
          durationMinutes: 60,
          price: 5000.5,
          status: "scheduled",
          notes: "Initial session",
          source: "manual",
          clientPackageId: null,
          clientPackageCode: null,
          clientPackageTitle: null,
          createdAt: "2027-06-01T09:00:00.000Z",
        },
        {
          id: 902,
          clientId: 502,
          clientName: "Maria Sokolova",
          serviceId: 8,
          serviceTitle: "Family therapy",
          scheduledAt: futureScheduledAt,
          durationMinutes: 90,
          price: 0,
          status: "scheduled",
          notes: "Package-backed session",
          source: "manual",
          clientPackageId: 801,
          clientPackageCode: "PKGACTIVE01",
          clientPackageTitle: "Package of 4 sessions",
          createdAt: "2027-06-02T09:00:00.000Z",
        },
      ],
    });
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].sql).toContain("ORDER BY");
    expect(queryLog[0].values).toEqual([]);
  });

  it("returns an empty sessions list", async () => {
    const { queryLog } = createQueryMock({ listRows: [] });

    const res = await callAdminSessions({ method: "GET" });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ items: [] });
    expect(queryLog).toHaveLength(1);
  });

  it("applies implemented list filters to SQL conditions and params", async () => {
    const { queryLog } = createQueryMock({ listRows: [] });

    const res = await callAdminSessions({
      method: "GET",
      query: {
        scope: "active",
        status: "scheduled",
        clientId: "501",
        serviceId: "7",
        search: "  pkg  ",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].values).toEqual(["scheduled", 501, 7, "%pkg%"]);
    expect(queryLog[0].sql).toContain("s.status = 'scheduled'");
    expect(queryLog[0].sql).toContain("s.status = $1");
    expect(queryLog[0].sql).toContain("s.client_id = $2");
    expect(queryLog[0].sql).toContain("s.service_id = $3");
    expect(queryLog[0].sql).toContain("CAST(s.id AS TEXT) ILIKE $4");
    expect(queryLog[0].sql).toContain("c.name ILIKE $4");
    expect(queryLog[0].sql).toContain("sv.title ILIKE $4");
    expect(queryLog[0].sql).toContain("s.notes ILIKE $4");
    expect(queryLog[0].sql).toContain("csp.code ILIKE $4");
    expect(queryLog[0].sql).toContain("spp.title ILIKE $4");
  });

  it("adds archived scope status conditions", async () => {
    const { queryLog } = createQueryMock({ listRows: [] });

    const res = await callAdminSessions({
      method: "GET",
      query: { scope: "archived" },
    });

    expect(res.statusCode).toBe(200);
    expect(queryLog[0].sql).toContain(
      "s.status IN ('completed', 'cancelled', 'no_show')"
    );
    expect(queryLog[0].values).toEqual([]);
  });

    it("paginates archived sessions and returns hasMore when an extra row is loaded", async () => {
    const { queryLog } = createQueryMock({
      listRows: [
        sessionRow({ id: "901" }),
        sessionRow({ id: "902" }),
        sessionRow({ id: "903" }),
      ],
    });

    const res = await callAdminSessions({
      method: "GET",
      query: {
        scope: "archived",
        limit: "2",
        offset: "4",
      },
    });

    const body = res.jsonBody as {
      items: unknown[];
      hasMore?: boolean;
    };

    expect(res.statusCode).toBe(200);
    expect(body.items).toHaveLength(2);
    expect(body.hasMore).toBe(true);
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].sql).toContain(
      "s.status IN ('completed', 'cancelled', 'no_show')"
    );
    expect(queryLog[0].sql).toContain("LIMIT $1");
    expect(queryLog[0].sql).toContain("OFFSET $2");
    expect(queryLog[0].values).toEqual([3, 4]);
  });

  it.each([
    ["invalid scope", { scope: "future" }],
    ["invalid status", { status: "done" }],
    ["invalid clientId", { clientId: "bad" }],
    ["invalid serviceId", { serviceId: "0" }],
    ["invalid limit zero", { limit: "0" }],
    ["invalid limit negative", { limit: "-1" }],
    ["invalid limit decimal", { limit: "1.5" }],
    ["invalid limit text", { limit: "many" }],
    ["invalid offset negative", { offset: "-1" }],
    ["invalid offset decimal", { offset: "1.5" }],
    ["invalid offset text", { offset: "next" }],
  ])("rejects invalid list query: %s", async (_caseName, query) => {
    const res = await callAdminSessions({ method: "GET", query });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("creates a regular session without package and checks overlap before insert", async () => {
    const { queryLog } = createQueryMock({
      selectedSession: sessionRow({
        id: 910,
        notes: "Initial session",
        price: "5000.50",
      }),
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload({
        notes: "  Initial session  ",
        source: "",
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "WITH target")?.values).toEqual([
      futureScheduledAt,
      60,
      null,
    ]);
    expect(findQuery(queryLog, "INSERT INTO sessions")?.values).toEqual([
      501,
      7,
      futureScheduledAt,
      60,
      5000.5,
      "scheduled",
      "Initial session",
      "manual",
      null,
    ]);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 910,
        price: 5000.5,
        notes: "Initial session",
        source: "manual",
        clientPackageId: null,
      },
    });
  });

  it("returns 409 and skips insert when create overlap is found", async () => {
    const { queryLog } = createQueryMock({
      overlap: {
        id: 902,
        client_name: "Maria Sokolova",
        scheduled_at: futureScheduledAt,
        duration_minutes: 60,
      },
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload(),
    });

    expect(res.statusCode).toBe(409);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(findQuery(queryLog, "WITH target")).toBeDefined();
    expect(findQuery(queryLog, "INSERT INTO sessions")).toBeUndefined();
  });

  it("does not run overlap check for cancelled create", async () => {
    const { queryLog } = createQueryMock({
      selectedSession: sessionRow({
        id: 911,
        status: "cancelled",
        notes: "Cancelled session",
      }),
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload({
        status: "cancelled",
        notes: " Cancelled session ",
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "WITH target")).toBeUndefined();
    expect(findQuery(queryLog, "INSERT INTO sessions")?.values?.[5]).toBe(
      "cancelled"
    );
  });

  it("rejects past scheduledAt on create before DB access", async () => {
    const res = await callAdminSessions({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload({ scheduledAt: pastScheduledAt }),
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON string", "{bad json"],
    ["invalid clientId", createSessionPayload({ clientId: 0 })],
    ["invalid serviceId", createSessionPayload({ serviceId: "bad" })],
    ["invalid scheduledAt", createSessionPayload({ scheduledAt: "not-a-date" })],
    ["invalid durationMinutes", createSessionPayload({ durationMinutes: 0 })],
    ["negative price", createSessionPayload({ price: -1 })],
    ["invalid clientPackageId", createSessionPayload({ clientPackageId: "bad" })],
  ])("rejects invalid create payload: %s", async (_caseName, body) => {
    const res = await callAdminSessions({
      method: "POST",
      query: { action: "create" },
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns a safe 500 when create DB access fails", async () => {
    createQueryMock({ throwOn: "overlap" });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload(),
    });

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
  });

  it("updates a regular session after selecting the existing row", async () => {
    const { queryLog } = createQueryMock({
      existingSession: sessionRow({ id: 901 }),
      selectedSession: sessionRow({
        id: 901,
        scheduled_at: updatedFutureScheduledAt,
        price: "6000",
        notes: "Updated session",
      }),
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload(),
    });

    expect(res.statusCode).toBe(200);
    expect(findQueries(queryLog, "WHERE s.id = $1")).toHaveLength(2);
    expect(findQuery(queryLog, "WITH target")?.values).toEqual([
      updatedFutureScheduledAt,
      60,
      901,
    ]);
    expect(findQuery(queryLog, "UPDATE sessions")?.values).toEqual([
      501,
      7,
      updatedFutureScheduledAt,
      60,
      6000,
      "scheduled",
      "Updated session",
      null,
      901,
    ]);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 901,
        price: 6000,
        notes: "Updated session",
      },
    });
  });

  it("returns 404 when the existing session is not found before update", async () => {
    const { queryLog } = createQueryMock({ existingSession: null });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload(),
    });

    expect(res.statusCode).toBe(404);
    expect(findQuery(queryLog, "UPDATE sessions")).toBeUndefined();
  });

  it("rejects moving an existing session to the past before update", async () => {
    const { queryLog } = createQueryMock({
      existingSession: sessionRow({ scheduled_at: futureScheduledAt }),
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload({ scheduledAt: pastScheduledAt }),
    });

    expect(res.statusCode).toBe(400);
    expect(findQuery(queryLog, "WITH target")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE sessions")).toBeUndefined();
  });

  it("allows updating an unchanged past scheduledAt without failing only because it is in the past", async () => {
    const { queryLog } = createQueryMock({
      existingSession: sessionRow({ scheduled_at: pastScheduledAt }),
      selectedSession: sessionRow({
        scheduled_at: pastScheduledAt,
        status: "completed",
        notes: "Historical correction",
      }),
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload({
        scheduledAt: pastScheduledAt,
        status: "completed",
        notes: " Historical correction ",
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "UPDATE sessions")).toBeDefined();
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        scheduledAt: pastScheduledAt,
      },
    });
  });

  it("returns 409 and skips update when update overlap is found", async () => {
    const { queryLog } = createQueryMock({
      existingSession: sessionRow({ id: 901 }),
      overlap: {
        id: 902,
        client_name: "Maria Sokolova",
        scheduled_at: updatedFutureScheduledAt,
        duration_minutes: 60,
      },
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload(),
    });

    expect(res.statusCode).toBe(409);
    expect(findQuery(queryLog, "WITH target")?.values).toEqual([
      updatedFutureScheduledAt,
      60,
      901,
    ]);
    expect(findQuery(queryLog, "UPDATE sessions")).toBeUndefined();
  });

  it("does not run overlap check for cancelled update", async () => {
    const { queryLog } = createQueryMock({
      existingSession: sessionRow({ id: 901 }),
      selectedSession: sessionRow({
        id: 901,
        status: "cancelled",
      }),
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload({ status: "cancelled" }),
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "WITH target")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE sessions")?.values?.[5]).toBe(
      "cancelled"
    );
  });

  it("returns 404 when update returns no rows", async () => {
    const { queryLog } = createQueryMock({
      existingSession: sessionRow({ id: 901 }),
      updatedSessionId: null,
    });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body: updateSessionPayload({ status: "cancelled" }),
    });

    expect(res.statusCode).toBe(404);
    expect(findQuery(queryLog, "UPDATE sessions")).toBeDefined();
    expect(findQueries(queryLog, "WHERE s.id = $1")).toHaveLength(1);
  });

  it.each([
    ["invalid id", updateSessionPayload({ id: 0 })],
    ["invalid clientId", updateSessionPayload({ clientId: "bad" })],
    ["invalid serviceId", updateSessionPayload({ serviceId: 0 })],
    ["invalid scheduledAt", updateSessionPayload({ scheduledAt: "not-a-date" })],
    ["invalid durationMinutes", updateSessionPayload({ durationMinutes: 30.5 })],
    ["negative price", updateSessionPayload({ price: -1 })],
    ["missing status", { ...updateSessionPayload(), status: undefined }],
    ["invalid status", updateSessionPayload({ status: "done" })],
    ["invalid clientPackageId", updateSessionPayload({ clientPackageId: -1 })],
  ])("rejects invalid update payload: %s", async (_caseName, body) => {
    const res = await callAdminSessions({
      method: "POST",
      query: { action: "update" },
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("deletes a session and returns its numeric id", async () => {
    const { queryLog } = createQueryMock({ deletedSessionId: "901" });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "delete" },
      body: JSON.stringify({ id: "901" }),
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "DELETE FROM sessions")?.values).toEqual([901]);
    expect(res.jsonBody).toEqual({ success: true, id: 901 });
  });

  it("rejects invalid delete id before DB access", async () => {
    const res = await callAdminSessions({
      method: "POST",
      query: { action: "delete" },
      body: { id: "bad" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns 404 when delete returns no rows", async () => {
    const { queryLog } = createQueryMock({ deletedSessionId: null });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "delete" },
      body: { id: 999 },
    });

    expect(res.statusCode).toBe(404);
    expect(findQuery(queryLog, "DELETE FROM sessions")).toBeDefined();
  });

  it("returns a safe 500 when delete DB access fails", async () => {
    createQueryMock({ throwOn: "delete" });

    const res = await callAdminSessions({
      method: "POST",
      query: { action: "delete" },
      body: { id: 901 },
    });

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
  });

  it("handles unsupported methods and unknown POST actions without DB access", async () => {
    const unsupportedMethodRes = await callAdminSessions({
      method: "PUT",
      query: { action: "create" },
      body: createSessionPayload(),
    });

    expect(unsupportedMethodRes.statusCode).toBe(405);
    expect(unsupportedMethodRes.jsonBody).toEqual({
      error: "Method not allowed",
    });
    expect(requireAdminRequestMock).not.toHaveBeenCalled();

    const unknownActionRes = await callAdminSessions({
      method: "POST",
      query: { action: "unknown" },
      body: {},
    });

    expect(unknownActionRes.statusCode).toBe(405);
    expect(unknownActionRes.jsonBody).toEqual({ error: "Method not allowed" });
    expect(requireAdminRequestMock).toHaveBeenCalledTimes(1);
    expect(poolQueryMock).not.toHaveBeenCalled();
  });
});
