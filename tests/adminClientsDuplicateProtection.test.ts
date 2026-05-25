import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "./helpers/http";

const poolQueryMock = vi.fn();

vi.mock("../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
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

type RequestRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
};

type MockDbOptions = {
  existingByContacts?: ClientRow | null;
  duplicateOnUpdate?: ClientRow | null;
  existingByFirstRequest?: ClientRow | null;
  request?: RequestRow | null;
  insertedClient?: ClientRow;
  updatedClient?: ClientRow | null;
};

const createdClientRow: ClientRow = {
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

const existingClientRow: ClientRow = {
  ...createdClientRow,
  id: "77",
  name: "Existing Client",
  phone: "+79189990099",
  email: "existing@example.com",
  source: "website",
  is_favorite: true,
  has_active_packages: true,
  preferred_contact_method: "whatsapp",
  preferred_contact_value: "+79189990099",
  first_request_id: "55",
};

const requestRow: RequestRow = {
  id: 301,
  name: "Request Client",
  phone: "+79181112233",
  email: "request@example.com",
  preferred_contact_method: "telegram",
  preferred_contact_value: "@request_client",
  source: "website",
};

function createClientPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "  Irina Petrova  ",
    phone: "+79189990099",
    email: " Irina@Example.COM ",
    source: " manual ",
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
    email: "irina-updated@example.com",
    source: "manual",
    status: "active",
    preferredContactMethod: "telegram",
    preferredContactValue: "@irina_updated",
    ...overrides,
  };
}

function createMockDb(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (
      sql.includes("FROM clients") &&
      sql.includes("WHERE first_request_id = $1")
    ) {
      return {
        rows: options.existingByFirstRequest
          ? [options.existingByFirstRequest]
          : [],
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
      sql.includes("WHERE") &&
      sql.includes("ORDER BY created_at ASC") &&
      !sql.includes("WHERE id <> $1")
    ) {
      return {
        rows:
          options.existingByContacts === null ||
          options.existingByContacts === undefined
            ? []
            : [options.existingByContacts],
      };
    }

    if (
      sql.includes("FROM requests") &&
      sql.includes("WHERE id = $1") &&
      sql.includes("LIMIT 1")
    ) {
      return {
        rows: options.request === null ? [] : [options.request ?? requestRow],
      };
    }

    if (sql.includes("INSERT INTO clients")) {
      return {
        rows: [options.insertedClient ?? createdClientRow],
      };
    }

    if (
      sql.includes("UPDATE clients") &&
      sql.includes("preferred_contact_method") &&
      !sql.includes("name = $2")
    ) {
      return { rows: [] };
    }

    if (sql.includes("UPDATE requests")) {
      return { rows: [] };
    }

    if (sql.includes("UPDATE clients") && sql.includes("name = $2")) {
      return {
        rows:
          options.updatedClient === null
            ? []
            : [
                options.updatedClient ?? {
                  ...createdClientRow,
                  id: "501",
                  name: "Irina Updated",
                  phone: "+79189990099",
                  email: "irina-updated@example.com",
                  preferred_contact_method: "telegram",
                  preferred_contact_value: "@irina_updated",
                  first_request_id: "44",
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

function hasQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.some((entry) => entry.sql.includes(fragment));
}

async function loadClientsHandler() {
  const module = await import("../api/admin/clients");
  return module.default;
}

describe("admin clients duplicate protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("creates a manual client with preferred contact and normalized response fields", async () => {
    const { queryLog } = createMockDb({
      existingByContacts: null,
      insertedClient: {
        ...createdClientRow,
        id: "501",
        first_request_id: "301",
      },
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 501,
        name: "Irina Petrova",
        phone: "+79189990099",
        email: "irina@example.com",
        source: "manual",
        status: "active",
        isFavorite: false,
        hasActivePackages: false,
        preferredContactMethod: "telegram",
        preferredContactValue: "@irina_test",
        firstRequestId: 301,
        createdAt: "2027-04-01T09:00:00.000Z",
      },
      alreadyExisted: false,
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

  it("reuses an existing client by phone without inserting a duplicate", async () => {
    const { queryLog } = createMockDb({
      existingByContacts: existingClientRow,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload({
        email: "",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: true,
      item: {
        id: 77,
        name: "Existing Client",
        phone: "+79189990099",
      },
    });
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      "79189990099",
    ]);
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
  });

  it("reuses an existing client by email without inserting a duplicate", async () => {
    const { queryLog } = createMockDb({
      existingByContacts: {
        ...existingClientRow,
        phone: "",
        email: "irina@example.com",
      },
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload({
        phone: "",
        email: " IRINA@example.com ",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: true,
      item: {
        id: 77,
        email: "irina@example.com",
      },
    });
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      "irina@example.com",
    ]);
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
  });

  it("does not partially create a client when both phone and email match an existing client", async () => {
    const { queryLog } = createMockDb({
      existingByContacts: existingClientRow,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: true,
      item: {
        id: 77,
      },
    });
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      "79189990099",
      "irina@example.com",
    ]);
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE clients")).toBeUndefined();
  });

  it("creates a client from a request and links the request", async () => {
    const { queryLog } = createMockDb({
      existingByFirstRequest: null,
      existingByContacts: null,
      request: requestRow,
      insertedClient: {
        ...createdClientRow,
        id: "601",
        name: "Request Client",
        phone: "+79181112233",
        email: "request@example.com",
        source: "website",
        preferred_contact_method: "telegram",
        preferred_contact_value: "@request_client",
        first_request_id: "301",
      },
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create-from-request" },
      body: { requestId: 301 },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: false,
      item: {
        id: 601,
        firstRequestId: 301,
        preferredContactMethod: "telegram",
        preferredContactValue: "@request_client",
      },
    });
    expect(findQuery(queryLog, "INSERT INTO clients")?.values).toEqual([
      "Request Client",
      "+79181112233",
      "request@example.com",
      "telegram",
      "@request_client",
      "website",
      301,
    ]);
    expect(findQuery(queryLog, "UPDATE requests")?.values).toEqual([301, 601]);
  });

  it("links a request to an existing client by contacts instead of inserting a duplicate", async () => {
    const { queryLog } = createMockDb({
      existingByFirstRequest: null,
      existingByContacts: existingClientRow,
      request: requestRow,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create-from-request" },
      body: { requestId: 301 },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: true,
      item: {
        id: 77,
      },
    });
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
    expect(
      findQueries(queryLog, "UPDATE clients").find((entry) =>
        entry.sql.includes("preferred_contact_method")
      )?.values
    ).toEqual(["77", "telegram", "@request_client"]);
    expect(findQuery(queryLog, "UPDATE requests")?.values).toEqual([301, 77]);
  });

  it("returns an existing client by first_request_id and relinks the request", async () => {
    const { queryLog } = createMockDb({
      existingByFirstRequest: existingClientRow,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create-from-request" },
      body: { requestId: 55 },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      alreadyExisted: true,
      item: {
        id: 77,
        firstRequestId: 55,
      },
    });
    expect(findQuery(queryLog, "FROM requests")).toBeUndefined();
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE requests")?.values).toEqual([55, 77]);
  });

  it("updates a client and preserves provided preferred contact values", async () => {
    const { queryLog } = createMockDb({
      duplicateOnUpdate: null,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: updateClientPayload(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 501,
        name: "Irina Updated",
        firstRequestId: 44,
        preferredContactMethod: "telegram",
        preferredContactValue: "@irina_updated",
      },
    });
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      501,
      "79189990099",
      "irina-updated@example.com",
    ]);
    expect(findQuery(queryLog, "UPDATE clients")?.values).toEqual([
      501,
      "Irina Updated",
      "+79189990099",
      "irina-updated@example.com",
      "manual",
      "active",
      "telegram",
      "@irina_updated",
    ]);
  });

  it("allows update when only the current client matches its own phone and email", async () => {
    const { queryLog } = createMockDb({
      duplicateOnUpdate: null,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: updateClientPayload({
        email: "IRINA-UPDATED@example.com",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "FROM clients")?.sql).toContain("WHERE id <> $1");
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      501,
      "79189990099",
      "irina-updated@example.com",
    ]);
    expect(findQuery(queryLog, "UPDATE clients")).toBeDefined();
  });

  it("rejects update to another client's phone or email without updating clients", async () => {
    const { queryLog } = createMockDb({
      duplicateOnUpdate: existingClientRow,
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: updateClientPayload(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
    expect(findQuery(queryLog, "FROM clients")?.sql).toContain("WHERE id <> $1");
    expect(findQuery(queryLog, "UPDATE clients")).toBeUndefined();
  });

  it("rejects missing required preferred contact on create before querying the database", async () => {
    const { queryLog } = createMockDb();

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload({
        preferredContactMethod: "",
        preferredContactValue: "",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
    expect(queryLog).toHaveLength(0);
  });

  it("rejects invalid payloads and unsupported methods/actions", async () => {
    const { queryLog } = createMockDb();
    const handler = await loadClientsHandler();

    const invalidCreateReq = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload({
        name: " ",
      }),
    });
    const invalidCreateRes = createMockResponse();
    await handler(invalidCreateReq, invalidCreateRes);

    const invalidContactReq = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createClientPayload({
        phone: "",
        email: "",
      }),
    });
    const invalidContactRes = createMockResponse();
    await handler(invalidContactReq, invalidContactRes);

    const unsupportedMethodReq = createMockRequest({
      method: "PUT",
      query: { action: "create" },
    });
    const unsupportedMethodRes = createMockResponse();
    await handler(unsupportedMethodReq, unsupportedMethodRes);

    const unsupportedActionReq = createMockRequest({
      method: "POST",
      query: { action: "missing-action" },
    });
    const unsupportedActionRes = createMockResponse();
    await handler(unsupportedActionReq, unsupportedActionRes);

    expect(invalidCreateRes.statusCode).toBe(400);
    expect(invalidContactRes.statusCode).toBe(400);
    expect(unsupportedMethodRes.statusCode).toBe(405);
    expect(unsupportedActionRes.statusCode).toBe(405);
    expect(queryLog).toHaveLength(0);
  });
});
