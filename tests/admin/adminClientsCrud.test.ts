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

type ClientRow = {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  is_favorite: boolean;
  has_active_packages: boolean;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
  first_request_id: number | string | null;
  created_at: string;
};

type MockDbOptions = {
  listRows?: ClientRow[];
  existingByContacts?: ClientRow | null;
  duplicateOnUpdate?: ClientRow | null;
  selectedClient?: ClientRow | null;
  insertedClient?: ClientRow;
  updatedClient?: ClientRow | null;
  favoriteUpdatedClient?: ClientRow | null;
  throwOn?: "list" | "create" | "update" | "favorite";
};

const baseClientRow: ClientRow = {
  id: "501",
  name: "Irina Petrova",
  phone: "+79189990099",
  email: "irina@example.com",
  source: "manual",
  status: "active",
  is_favorite: false,
  has_active_packages: false,
  preferred_contact_method: "telegram",
  preferred_contact_value: "@irina_test",
  first_request_id: null,
  created_at: "2027-04-01T09:00:00.000Z",
};

const favoriteClientRow: ClientRow = {
  ...baseClientRow,
  id: "77",
  name: "Favorite Client",
  source: "website",
  is_favorite: true,
  has_active_packages: true,
  preferred_contact_method: "whatsapp",
  preferred_contact_value: "+79189990099",
  first_request_id: "301",
};

function createClientPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "  Irina Petrova  ",
    phone: "+79189990099",
    email: " Irina@Example.COM ",
    preferredContactMethod: "telegram",
    preferredContactValue: " @irina_test ",
    ...overrides,
  };
}

function updateClientPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 501,
    name: "  Irina Updated  ",
    phone: "+79189990099",
    email: " irina-updated@example.com ",
    source: " crm ",
    status: "active",
    preferredContactMethod: "telegram",
    preferredContactValue: " @irina_updated ",
    ...overrides,
  };
}

function createMockDb(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (
      sql.includes("FROM clients") &&
      sql.includes("ORDER BY") &&
      sql.includes("CASE") &&
      !sql.includes("LIMIT 1")
    ) {
      if (options.throwOn === "list") {
        throw new Error("clients list db failure");
      }

      return {
        rows: options.listRows ?? [],
      };
    }

    if (
      sql.includes("FROM clients") &&
      sql.includes("WHERE id <> $1") &&
      sql.includes("ORDER BY created_at ASC")
    ) {
      return {
        rows: options.duplicateOnUpdate ? [options.duplicateOnUpdate] : [],
      };
    }

    if (
      sql.includes("FROM clients") &&
      sql.includes("ORDER BY created_at ASC") &&
      !sql.includes("WHERE id <> $1")
    ) {
      return {
        rows: options.existingByContacts ? [options.existingByContacts] : [],
      };
    }

    if (
      sql.includes("FROM clients") &&
      sql.includes("WHERE id = $1") &&
      sql.includes("LIMIT 1")
    ) {
      return {
        rows:
          options.selectedClient === null
            ? []
            : [options.selectedClient ?? baseClientRow],
      };
    }

    if (sql.includes("INSERT INTO clients")) {
      if (options.throwOn === "create") {
        throw new Error("clients insert db failure");
      }

      return {
        rows: [options.insertedClient ?? baseClientRow],
      };
    }

    if (sql.includes("UPDATE clients") && sql.includes("name = $2")) {
      if (options.throwOn === "update") {
        throw new Error("clients update db failure");
      }

      return {
        rows:
          options.updatedClient === null
            ? []
            : [options.updatedClient ?? baseClientRow],
      };
    }

    if (
      sql.includes("UPDATE clients") &&
      sql.includes("SET is_favorite = NOT is_favorite")
    ) {
      if (options.throwOn === "favorite") {
        throw new Error("favorite db failure");
      }

      return {
        rows:
          options.favoriteUpdatedClient === null
            ? []
            : [
                options.favoriteUpdatedClient ?? {
                  ...baseClientRow,
                  is_favorite: true,
                },
              ],
      };
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

async function loadClientsHandler() {
  const module = await import("../../api/admin/clients");
  return module.default;
}

describe("admin clients CRUD API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
  });

  it("lists clients with mapped and normalized frontend fields", async () => {
    const { queryLog } = createMockDb({
      listRows: [
        favoriteClientRow,
        {
          ...baseClientRow,
          id: "502",
          status: "unknown",
          preferred_contact_method: null,
          preferred_contact_value: null,
        },
      ],
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 77,
          name: "Favorite Client",
          phone: "+79189990099",
          email: "irina@example.com",
          source: "website",
          status: "active",
          isFavorite: true,
          hasActivePackages: true,
          preferredContactMethod: "whatsapp",
          preferredContactValue: "+79189990099",
          firstRequestId: 301,
          createdAt: "2027-04-01T09:00:00.000Z",
        },
        {
          id: 502,
          name: "Irina Petrova",
          phone: "+79189990099",
          email: "irina@example.com",
          source: "manual",
          status: "active",
          isFavorite: false,
          hasActivePackages: false,
          preferredContactMethod: null,
          preferredContactValue: null,
          firstRequestId: null,
          createdAt: "2027-04-01T09:00:00.000Z",
        },
      ],
    });
    expect(findQuery(queryLog, "FROM clients")?.sql).toContain(
      "ORDER BY"
    );
  });

  it("returns an empty clients list", async () => {
    createMockDb({ listRows: [] });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ items: [] });
  });

  it("applies status, favorite and search filters to the list query", async () => {
    const { queryLog } = createMockDb({ listRows: [favoriteClientRow] });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "GET",
        query: {
          status: "active",
          favorite: "favorites",
          search: " Irina ",
        },
      }),
      res
    );

    const listQuery = findQuery(queryLog, "FROM clients");
    expect(res.statusCode).toBe(200);
    expect(listQuery?.sql).toContain("status = $1");
    expect(listQuery?.sql).toContain("is_favorite = true");
    expect(listQuery?.sql).toContain("status = 'active'");
    expect(listQuery?.sql).toContain("name ILIKE $2");
    expect(listQuery?.sql).toContain("preferred_contact_value ILIKE $2");
    expect(listQuery?.values).toEqual(["active", "%Irina%"]);
  });

  it("rejects invalid list filters before DB access", async () => {
    const { queryLog } = createMockDb();
    const handler = await loadClientsHandler();

    const invalidStatusRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: { status: "archived" },
      }),
      invalidStatusRes
    );

    const invalidFavoriteRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: { favorite: "yes" },
      }),
      invalidFavoriteRes
    );

    expect(invalidStatusRes.statusCode).toBe(400);
    expect(invalidStatusRes.jsonBody).toEqual({
      error: "Invalid status filter",
    });
    expect(invalidFavoriteRes.statusCode).toBe(400);
    expect(invalidFavoriteRes.jsonBody).toEqual({
      error: "Invalid favorite filter",
    });
    expect(queryLog).toHaveLength(0);
  });

  it("creates a client with trimmed payload values and manual source default", async () => {
    const { queryLog } = createMockDb({
      existingByContacts: null,
      insertedClient: {
        ...baseClientRow,
        id: "601",
        first_request_id: null,
      },
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "create" },
        body: createClientPayload({ source: "" }),
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: false,
      item: {
        id: 601,
        status: "active",
        isFavorite: false,
        preferredContactMethod: "telegram",
        preferredContactValue: "@irina_test",
      },
    });
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      "79189990099",
      "irina@example.com",
    ]);
    expect(findQuery(queryLog, "INSERT INTO clients")?.values).toEqual([
      "Irina Petrova",
      "+79189990099",
      "Irina@Example.COM",
      "telegram",
      "@irina_test",
      "manual",
    ]);
  });

  it("rejects invalid create payloads before DB access", async () => {
    const { queryLog } = createMockDb();
    const handler = await loadClientsHandler();

    for (const body of [
      "{bad json",
      createClientPayload({ name: " " }),
      createClientPayload({ phone: "", email: "" }),
      createClientPayload({ phone: "+1 555 123 4567" }),
      createClientPayload({ preferredContactMethod: "icq" }),
    ]) {
      const res = createMockResponse();

      await handler(
        createMockRequest({
          method: "POST",
          query: { action: "create" },
          body,
        }),
        res
      );

      expect(res.statusCode).toBe(400);
      expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
    }

    expect(queryLog).toHaveLength(0);
  });

  it("updates a client and sends preferred contact/status values to DB", async () => {
    const { queryLog } = createMockDb({
      duplicateOnUpdate: null,
      updatedClient: {
        ...baseClientRow,
        id: "501",
        name: "Irina Updated",
        email: "irina-updated@example.com",
        source: "crm",
        status: "active",
        is_favorite: true,
        preferred_contact_method: "telegram",
        preferred_contact_value: "@irina_updated",
        first_request_id: "44",
      },
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: updateClientPayload(),
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 501,
        name: "Irina Updated",
        status: "active",
        isFavorite: true,
        preferredContactMethod: "telegram",
        preferredContactValue: "@irina_updated",
        firstRequestId: 44,
      },
    });
    expect(findQuery(queryLog, "UPDATE clients")?.values).toEqual([
      501,
      "Irina Updated",
      "+79189990099",
      "irina-updated@example.com",
      "crm",
      "active",
      "telegram",
      "@irina_updated",
    ]);
  });

  it("marks a client inactive through update and relies on SQL to clear favorite", async () => {
    const { queryLog } = createMockDb({
      duplicateOnUpdate: null,
      updatedClient: {
        ...baseClientRow,
        status: "inactive",
        is_favorite: false,
      },
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: updateClientPayload({ status: "inactive" }),
      }),
      res
    );

    const updateQuery = findQuery(queryLog, "UPDATE clients");
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      item: {
        status: "inactive",
        isFavorite: false,
      },
    });
    expect(updateQuery?.sql).toContain(
      "is_favorite = CASE WHEN $6 = 'active' THEN is_favorite ELSE false END"
    );
    expect(updateQuery?.values?.[5]).toBe("inactive");
  });

  it("returns 404 when update finds no client", async () => {
    createMockDb({
      duplicateOnUpdate: null,
      updatedClient: null,
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: updateClientPayload(),
      }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
  });

  it("rejects invalid update payloads before DB access", async () => {
    const { queryLog } = createMockDb();
    const handler = await loadClientsHandler();

    for (const body of [
      "{bad json",
      updateClientPayload({ id: 0 }),
      updateClientPayload({ name: "" }),
      updateClientPayload({ phone: "", email: "" }),
      updateClientPayload({ status: "archived" }),
      updateClientPayload({ preferredContactMethod: "", preferredContactValue: "" }),
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
      expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
    }

    expect(queryLog).toHaveLength(0);
  });

  it("toggles favorite for active clients", async () => {
    const { queryLog } = createMockDb({
      selectedClient: baseClientRow,
      favoriteUpdatedClient: {
        ...baseClientRow,
        is_favorite: true,
      },
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "toggle-favorite" },
        body: { id: 501 },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 501,
        isFavorite: true,
      },
    });
    expect(findQuery(queryLog, "WHERE id = $1")?.values).toEqual([501]);
    expect(findQuery(queryLog, "SET is_favorite = NOT is_favorite")?.values).toEqual([
      501,
    ]);
  });

  it("rejects invalid, missing and inactive favorite toggles", async () => {
    const handler = await loadClientsHandler();

    const invalidDb = createMockDb();
    const invalidRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "toggle-favorite" },
        body: { id: 0 },
      }),
      invalidRes
    );
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidDb.queryLog).toHaveLength(0);

    createMockDb({ selectedClient: null });
    const missingRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "toggle-favorite" },
        body: { id: 501 },
      }),
      missingRes
    );
    expect(missingRes.statusCode).toBe(404);

    const inactiveDb = createMockDb({
      selectedClient: {
        ...baseClientRow,
        status: "inactive",
      },
    });
    const inactiveRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "toggle-favorite" },
        body: { id: 501 },
      }),
      inactiveRes
    );
    expect(inactiveRes.statusCode).toBe(400);
    expect(
      findQuery(inactiveDb.queryLog, "SET is_favorite = NOT is_favorite")
    ).toBeUndefined();
  });

  it("returns safe errors for DB failures", async () => {
    const handler = await loadClientsHandler();

    createMockDb({ throwOn: "list" });
    const listRes = createMockResponse();
    await handler(createMockRequest({ method: "GET" }), listRes);
    expect(listRes.statusCode).toBe(500);
    expect(listRes.jsonBody).toEqual({ error: "Failed to load clients" });

    createMockDb({ existingByContacts: null, throwOn: "create" });
    const createRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "create" },
        body: createClientPayload(),
      }),
      createRes
    );
    expect(createRes.statusCode).toBe(500);
    expect(createRes.jsonBody).toEqual({ error: "Failed to create client" });

    createMockDb({ duplicateOnUpdate: null, throwOn: "update" });
    const updateRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: updateClientPayload(),
      }),
      updateRes
    );
    expect(updateRes.statusCode).toBe(500);
    expect(String((updateRes.jsonBody as { error?: string }).error)).toBeTruthy();
  });

  it("handles unsupported methods and unknown or missing POST actions", async () => {
    createMockDb();
    const handler = await loadClientsHandler();

    const putRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "PUT",
        query: { action: "create" },
      }),
      putRes
    );

    const unknownActionRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "unknown" },
      }),
      unknownActionRes
    );

    const missingActionRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
      }),
      missingActionRes
    );

    expect(putRes.statusCode).toBe(405);
    expect(putRes.jsonBody).toEqual({ error: "Method not allowed" });
    expect(unknownActionRes.statusCode).toBe(405);
    expect(unknownActionRes.jsonBody).toEqual({ error: "Method not allowed" });
    expect(missingActionRes.statusCode).toBe(405);
    expect(missingActionRes.jsonBody).toEqual({ error: "Method not allowed" });
  });
});
