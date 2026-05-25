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

vi.mock("../../server/reminders/processSessionReminders", () => ({
  processSessionReminders: processSessionRemindersMock,
}));

vi.mock("../../server/auth/requireAdmin", () => ({
  requireAdminRequest: requireAdminRequestMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type ClientPackageValidationRow = {
  id: number | string;
  client_id: number | string;
  service_id: number | string;
  service_duration_minutes: number | string;
  status: string;
  sessions_count: number | string;
  used_sessions_count: number | string;
};

type SessionRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  service_id: number | string;
  service_title: string;
  scheduled_at: string;
  duration_minutes: number | string;
  price: number | string;
  status: string;
  notes: string;
  source: string;
  client_package_id: number | string | null;
  client_package_code: string | null;
  client_package_title: string | null;
  created_at: string;
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

type ClientPackageListRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  package_plan_id: number | string;
  package_title: string;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  sessions_count: number | string;
  price: number | string;
  code: string;
  status: string;
  used_sessions_count: number | string;
  created_at: string;
};

type MockDbOptions = {
  packageValidation?: ClientPackageValidationRow | null;
  insertedSessionId?: number;
  updatedSessionId?: number;
  existingSession?: SessionRow | null;
  selectedSession?: SessionRow;
  overlap?: { id: number; client_name: string } | null;
  client?: ClientRow | null;
  clientPackages?: ClientPackageListRow[];
};

const packageValidationRow: ClientPackageValidationRow = {
  id: 801,
  client_id: 501,
  service_id: 1,
  service_duration_minutes: 60,
  status: "active",
  sessions_count: 4,
  used_sessions_count: 1,
};

const baseSessionRow: SessionRow = {
  id: 901,
  client_id: 501,
  client_name: "Irina Petrova",
  service_id: 1,
  service_title: "Consultation",
  scheduled_at: "2027-04-20T12:00:00.000Z",
  duration_minutes: 60,
  price: 0,
  status: "scheduled",
  notes: "Package session",
  source: "manual",
  client_package_id: 801,
  client_package_code: "PKGACTIVE01",
  client_package_title: "Package of 4 consultations",
  created_at: "2027-04-01T09:00:00.000Z",
};

const activeClientRow: ClientRow = {
  id: 501,
  name: "Irina Petrova",
  phone: "+7 (999) 123-45-67",
  email: "irina@example.com",
  source: "manual",
  status: "active",
  is_favorite: false,
  has_active_packages: true,
  preferred_contact_method: "telegram",
  preferred_contact_value: "@irina_test",
  first_request_id: null,
  created_at: "2027-04-01T09:00:00.000Z",
};

const activePackageListRow: ClientPackageListRow = {
  id: 801,
  client_id: 501,
  client_name: "Irina Petrova",
  package_plan_id: 42,
  package_title: "Package of 4 consultations",
  service_id: 1,
  service_title: "Consultation",
  service_duration_minutes: 60,
  sessions_count: 4,
  price: 14000,
  code: "PKGACTIVE01",
  status: "active",
  used_sessions_count: 3,
  created_at: "2027-04-01T09:00:00.000Z",
};

function createSessionPayload(overrides: Record<string, unknown> = {}) {
  return {
    clientId: 501,
    serviceId: 1,
    scheduledAt: "2027-04-20T12:00:00.000Z",
    durationMinutes: 60,
    price: 5000,
    status: "scheduled",
    notes: " Package session ",
    source: "manual",
    clientPackageId: 801,
    ...overrides,
  };
}

function createUpdatePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 901,
    clientId: 501,
    serviceId: 1,
    scheduledAt: "2027-04-20T12:00:00.000Z",
    durationMinutes: 60,
    price: 5000,
    status: "cancelled",
    notes: " Updated package session ",
    clientPackageId: 801,
    ...overrides,
  };
}

function createMockDb(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];
  let sessionSelectCount = 0;

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (
      sql.includes("FROM client_service_packages csp") &&
      sql.includes("s.status IN ('scheduled', 'completed', 'no_show')") &&
      sql.includes("AND ($2::bigint IS NULL OR s.id <> $2)")
    ) {
      return {
        rows:
          options.packageValidation === null
            ? []
            : [options.packageValidation ?? packageValidationRow],
      };
    }

    if (sql.includes("WITH target")) {
      return {
        rows: options.overlap ? [options.overlap] : [],
      };
    }

    if (sql.includes("INSERT INTO sessions")) {
      return {
        rows: [
          {
            id: options.insertedSessionId ?? 901,
          },
        ],
      };
    }

    if (sql.includes("UPDATE sessions")) {
      return {
        rows: [
          {
            id: options.updatedSessionId ?? 901,
          },
        ],
      };
    }

    if (
      sql.includes("FROM sessions s") &&
      sql.includes("LEFT JOIN client_service_packages") &&
      sql.includes("WHERE s.id = $1")
    ) {
      sessionSelectCount += 1;

      if (options.existingSession === null && sessionSelectCount === 1) {
        return { rows: [] };
      }

      if (sessionSelectCount === 1 && options.existingSession) {
        return { rows: [options.existingSession] };
      }

      return {
        rows: [
          options.selectedSession ?? {
            ...baseSessionRow,
            id: values?.[0] as number,
          },
        ],
      };
    }

    if (
      sql.includes("FROM clients") &&
      sql.includes("WHERE id = $1") &&
      sql.includes("LIMIT 1")
    ) {
      return {
        rows: options.client === null ? [] : [options.client ?? activeClientRow],
      };
    }

    if (
      sql.includes("FROM client_service_packages csp") &&
      sql.includes("WHERE csp.client_id = $1")
    ) {
      return {
        rows: options.clientPackages ?? [activePackageListRow],
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

async function loadSessionsHandler() {
  const module = await import("../../api/admin/sessions");
  return module.default;
}

async function loadClientsHandler() {
  const module = await import("../../api/admin/clients");
  return module.default;
}

describe("admin sessions package status accounting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
  });

  it("creates a package session with client_package_id and zero price", async () => {
    const { queryLog } = createMockDb({
      packageValidation: {
        ...packageValidationRow,
        sessions_count: 4,
        used_sessions_count: 1,
      },
      selectedSession: {
        ...baseSessionRow,
        status: "scheduled",
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 901,
        clientId: 501,
        serviceId: 1,
        status: "scheduled",
        price: 0,
        clientPackageId: 801,
        clientPackageCode: "PKGACTIVE01",
      },
    });

    const packageValidation = findQuery(
      queryLog,
      "FROM client_service_packages csp"
    );
    expect(packageValidation?.sql).toContain(
      "s.status IN ('scheduled', 'completed', 'no_show')"
    );
    expect(packageValidation?.values).toEqual([801, null]);

    const insert = findQuery(queryLog, "INSERT INTO sessions");
    expect(insert?.values).toEqual([
      501,
      1,
      "2027-04-20T12:00:00.000Z",
      60,
      0,
      "scheduled",
      "Package session",
      "manual",
      801,
    ]);
  });

  it("counts scheduled, completed and no_show package sessions when listing remaining sessions", async () => {
    const { queryLog } = createMockDb({
      clientPackages: [
        {
          ...activePackageListRow,
          sessions_count: 4,
          used_sessions_count: 3,
          status: "active",
        },
      ],
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "GET",
      query: {
        action: "list-packages",
        clientId: "501",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 801,
          clientId: 501,
          clientName: "Irina Petrova",
          packagePlanId: 42,
          packageTitle: "Package of 4 consultations",
          serviceId: 1,
          serviceTitle: "Consultation",
          serviceDurationMinutes: 60,
          totalSessions: 4,
          usedSessions: 3,
          remainingSessions: 1,
          price: 14000,
          code: "PKGACTIVE01",
          status: "active",
          createdAt: "2027-04-01T09:00:00.000Z",
        },
      ],
    });

    expect(findQuery(queryLog, "FROM client_service_packages csp")?.sql).toContain(
      "s.status IN ('scheduled', 'completed', 'no_show')"
    );
  });

  it("marks an active package as used when scheduled/completed/no_show sessions consume all units", async () => {
    const { queryLog } = createMockDb({
      clientPackages: [
        {
          ...activePackageListRow,
          sessions_count: 4,
          used_sessions_count: 4,
          status: "active",
        },
      ],
    });

    const handler = await loadClientsHandler();
    const req = createMockRequest({
      method: "GET",
      query: {
        action: "list-packages",
        clientId: "501",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      items: [
        {
          usedSessions: 4,
          remainingSessions: 0,
          status: "used",
        },
      ],
    });
    expect(hasQuery(queryLog, "DELETE FROM client_service_packages")).toBe(false);
    expect(hasQuery(queryLog, "UPDATE client_service_packages")).toBe(false);
  });

  it("does not spend package capacity for a cancelled session", async () => {
    const { queryLog } = createMockDb({
      packageValidation: {
        ...packageValidationRow,
        sessions_count: 1,
        used_sessions_count: 1,
      },
      selectedSession: {
        ...baseSessionRow,
        status: "cancelled",
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload({
        status: "cancelled",
        notes: "Cancelled placeholder",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        status: "cancelled",
        price: 0,
        clientPackageId: 801,
      },
    });
    expect(findQuery(queryLog, "WITH target")).toBeUndefined();
    expect(findQuery(queryLog, "INSERT INTO sessions")?.values).toEqual([
      501,
      1,
      "2027-04-20T12:00:00.000Z",
      60,
      0,
      "cancelled",
      "Cancelled placeholder",
      "manual",
      801,
    ]);
  });

  it("rejects a non-cancelled package session when package capacity is exhausted", async () => {
    const { queryLog } = createMockDb({
      packageValidation: {
        ...packageValidationRow,
        sessions_count: 2,
        used_sessions_count: 2,
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create" },
      body: createSessionPayload({
        status: "no_show",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
    expect(findQuery(queryLog, "INSERT INTO sessions")).toBeUndefined();
    expect(findQuery(queryLog, "WITH target")).toBeUndefined();
    expect(hasQuery(queryLog, "DELETE FROM client_service_packages")).toBe(false);
    expect(hasQuery(queryLog, "UPDATE client_service_packages")).toBe(false);
  });

  it("updates a package session to cancelled without counting the current session as used", async () => {
    const { queryLog } = createMockDb({
      existingSession: {
        ...baseSessionRow,
        status: "scheduled",
      },
      packageValidation: {
        ...packageValidationRow,
        sessions_count: 1,
        used_sessions_count: 0,
      },
      selectedSession: {
        ...baseSessionRow,
        status: "cancelled",
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createUpdatePayload({
        status: "cancelled",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "FROM client_service_packages csp")?.values).toEqual([
      801,
      901,
    ]);
    expect(findQuery(queryLog, "WITH target")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE sessions")?.values).toEqual([
      501,
      1,
      "2027-04-20T12:00:00.000Z",
      60,
      0,
      "cancelled",
      "Updated package session",
      801,
      901,
    ]);
  });

  it("updates a package session back to a spending status when capacity is available", async () => {
    const { queryLog } = createMockDb({
      existingSession: {
        ...baseSessionRow,
        status: "cancelled",
      },
      packageValidation: {
        ...packageValidationRow,
        sessions_count: 2,
        used_sessions_count: 1,
      },
      selectedSession: {
        ...baseSessionRow,
        status: "no_show",
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createUpdatePayload({
        status: "no_show",
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "FROM client_service_packages csp")?.sql).toContain(
      "s.status IN ('scheduled', 'completed', 'no_show')"
    );
    expect(findQuery(queryLog, "WITH target")?.values).toEqual([
      "2027-04-20T12:00:00.000Z",
      60,
      901,
    ]);
    expect(findQuery(queryLog, "UPDATE sessions")?.values?.[5]).toBe("no_show");
    expect(findQuery(queryLog, "UPDATE sessions")?.values?.[7]).toBe(801);
  });

  it("rejects keeping a package link when the edited service no longer matches the package service", async () => {
    const { queryLog } = createMockDb({
      existingSession: {
        ...baseSessionRow,
        status: "scheduled",
      },
      packageValidation: {
        ...packageValidationRow,
        service_id: 1,
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createUpdatePayload({
        serviceId: 2,
        clientPackageId: 801,
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(findQuery(queryLog, "UPDATE sessions")).toBeUndefined();
  });

  it("allows admin update to clear client_package_id explicitly", async () => {
    const { queryLog } = createMockDb({
      existingSession: {
        ...baseSessionRow,
        status: "scheduled",
      },
      selectedSession: {
        ...baseSessionRow,
        service_id: 2,
        client_package_id: null,
        client_package_code: null,
        client_package_title: null,
        price: 5000,
      },
    });

    const handler = await loadSessionsHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createUpdatePayload({
        serviceId: 2,
        price: 5000,
        clientPackageId: null,
      }),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "FROM client_service_packages csp")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE sessions")?.values).toEqual([
      501,
      2,
      "2027-04-20T12:00:00.000Z",
      60,
      5000,
      "cancelled",
      "Updated package session",
      null,
      901,
    ]);
  });
});
