import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "./helpers/http";

const {
  connectMock,
  validateBookableSlotMock,
  sendBookingNotificationsBoundedMock,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  validateBookableSlotMock: vi.fn(),
  sendBookingNotificationsBoundedMock: vi.fn(),
}));

vi.mock("../server/db/pool", () => ({
  pool: {
    connect: connectMock,
  },
}));

vi.mock("../server/publicBooking/bookingAvailability", () => ({
  getSingleQueryValue: (value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
      return value[0] ?? "";
    }

    return value ?? "";
  },
  validateBookableSlot: validateBookableSlotMock,
}));

vi.mock("../server/publicBooking/sendBookingNotifications", () => ({
  sendBookingNotificationsBounded: sendBookingNotificationsBoundedMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type ClientPackageRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  code: string;
  package_title: string;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  sessions_count: number | string;
  status: string;
  used_sessions_count: number | string;
};

type MockDbOptions = {
  clientPackage?: ClientPackageRow | null;
  requestId?: number;
  sessionId?: number;
};

const activePackageRow: ClientPackageRow = {
  id: 801,
  client_id: 501,
  client_name: "Irina Petrova",
  code: "PKGACTIVE01",
  package_title: "Package of 4 consultations",
  service_id: 1,
  service_title: "Consultation",
  service_duration_minutes: 60,
  sessions_count: 4,
  status: "active",
  used_sessions_count: 1,
};

function createPackageBookingRequest(overrides: Record<string, unknown> = {}) {
  return createMockRequest({
    method: "POST",
    query: { action: "create" },
    body: {
      serviceId: 1,
      startsAt: "2026-04-20T12:00:00.000Z",
      firstName: "  Irina  ",
      lastName: "  Petrova  ",
      phone: "+7 (999) 123-45-67",
      email: "Irina@Example.COM",
      preferredContactMethod: "telegram",
      preferredContactValue: " @irina_test ",
      message: "  Package booking  ",
      clientPackageCode: " pkgactive01 ",
      clientPackageContact: " IRINA@example.com ",
      consent: true,
      ...overrides,
    },
  });
}

function mockValidSlot() {
  validateBookableSlotMock.mockResolvedValue({
    ok: true,
    service: {
      id: 1,
      title: "Consultation",
      description: "Individual consultation",
      durationMinutes: 60,
      price: 5000,
    },
    slot: {
      startsAt: "2026-04-20T12:00:00.000Z",
      endsAt: "2026-04-20T13:00:00.000Z",
      startTime: "15:00",
      endTime: "16:00",
    },
    selectedDate: "2026-04-20",
    timezone: "Asia/Tomsk",
  });
}

function createPoolClient(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];
  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [] };
    }

    if (sql.includes("SELECT pg_advisory_xact_lock")) {
      return { rows: [] };
    }

    if (
      sql.includes("FROM client_service_packages") &&
      sql.includes("service_package_plans") &&
      sql.includes("clients") &&
      sql.includes("services")
    ) {
      return {
        rows:
          options.clientPackage === null
            ? []
            : [options.clientPackage ?? activePackageRow],
      };
    }

    if (
      sql.includes("UPDATE clients") &&
      sql.includes("preferred_contact_method")
    ) {
      return { rows: [] };
    }

    if (sql.includes("INSERT INTO requests")) {
      return {
        rows: [
          {
            id: options.requestId ?? 701,
          },
        ],
      };
    }

    if (
      sql.includes("UPDATE clients") &&
      sql.includes("first_request_id IS NULL")
    ) {
      return { rows: [] };
    }

    if (sql.includes("INSERT INTO sessions")) {
      return {
        rows: [
          {
            id: options.sessionId ?? 901,
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return {
    client: {
      query,
      release: vi.fn(),
    } as unknown as PoolClient & { release: ReturnType<typeof vi.fn> },
    query,
    queryLog,
  };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

function hasQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.some((entry) => entry.sql.includes(fragment));
}

async function loadHandler() {
  const module = await import("../api/public/booking");
  return module.default;
}

describe("public package booking by code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockValidSlot();
    sendBookingNotificationsBoundedMock.mockResolvedValue({
      completed: true,
      timeoutMs: 1500,
      notifications: {
        telegram: { status: "sent" },
        ownerEmail: { status: "sent" },
        clientEmail: { status: "sent" },
      },
    });
  });

  it("creates a booked request and a zero-price session linked to an active package", async () => {
    const { client, queryLog } = createPoolClient();
    connectMock.mockResolvedValue(client);

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(createPackageBookingRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      booking: {
        sessionId: 901,
        clientId: 501,
        serviceId: 1,
        serviceTitle: "Consultation",
        startsAt: "2026-04-20T12:00:00.000Z",
        endsAt: "2026-04-20T13:00:00.000Z",
        clientPackage: {
          id: 801,
          code: "PKGACTIVE01",
          packageTitle: "Package of 4 consultations",
          remainingSessions: 2,
        },
      },
      alreadyExistedClient: true,
    });

    const packageLookup = findQuery(queryLog, "FROM client_service_packages");
    expect(packageLookup?.sql).toContain("service_package_plans");
    expect(packageLookup?.sql).toContain("csp.status = 'active'");
    expect(packageLookup?.sql).toContain("FOR UPDATE OF csp");
    expect(packageLookup?.values).toEqual([
      "PKGACTIVE01",
      "",
      "irina@example.com",
    ]);

    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
    expect(findQuery(queryLog, "INSERT INTO requests")?.values).toEqual([
      "Irina Petrova",
      "+7 (999) 123-45-67",
      "Irina@Example.COM",
      "Package booking",
      "telegram",
      "@irina_test",
      501,
    ]);

    const sessionInsert = findQuery(queryLog, "INSERT INTO sessions");
    expect(sessionInsert?.values).toEqual([
      501,
      1,
      "2026-04-20T12:00:00.000Z",
      60,
      0,
      "Package booking",
      801,
    ]);
    expect(sessionInsert?.sql).toContain("client_package_id");
    expect(hasQuery(queryLog, "COMMIT")).toBe(true);
    expect(hasQuery(queryLog, "ROLLBACK")).toBe(false);
    expect(sendBookingNotificationsBoundedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 901,
        clientName: "Irina Petrova",
        clientPackage: {
          packageTitle: "Package of 4 consultations",
          code: "PKGACTIVE01",
          remainingSessions: 2,
        },
      })
    );
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("does not create a request or session when the package code is unknown", async () => {
    const { client, queryLog } = createPoolClient({ clientPackage: null });
    connectMock.mockResolvedValue(client);

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(
      createPackageBookingRequest({ clientPackageCode: "missing-code" }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toMatchObject({
      code: "invalid_package",
    });
    expect(hasQuery(queryLog, "INSERT INTO requests")).toBe(false);
    expect(hasQuery(queryLog, "INSERT INTO sessions")).toBe(false);
    expect(validateBookableSlotMock).not.toHaveBeenCalled();
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(hasQuery(queryLog, "ROLLBACK")).toBe(true);
  });

  it("does not create a request or session when the contact does not match the package owner", async () => {
    const { client, queryLog } = createPoolClient({ clientPackage: null });
    connectMock.mockResolvedValue(client);

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(
      createPackageBookingRequest({
        clientPackageContact: "+7 (900) 000-00-00",
      }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toMatchObject({
      code: "invalid_package",
    });
    expect(findQuery(queryLog, "FROM client_service_packages")?.values).toEqual([
      "PKGACTIVE01",
      "79000000000",
      "+7 (900) 000-00-00",
    ]);
    expect(hasQuery(queryLog, "INSERT INTO requests")).toBe(false);
    expect(hasQuery(queryLog, "INSERT INTO sessions")).toBe(false);
    expect(validateBookableSlotMock).not.toHaveBeenCalled();
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
  });

  it("does not create a request or session when the package has no remaining sessions", async () => {
    const { client, queryLog } = createPoolClient({
      clientPackage: {
        ...activePackageRow,
        sessions_count: 4,
        used_sessions_count: 4,
      },
    });
    connectMock.mockResolvedValue(client);

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(createPackageBookingRequest(), res);

    expect(res.statusCode).toBe(409);
    expect(res.jsonBody).toMatchObject({
      code: "package_unavailable",
    });
    expect(hasQuery(queryLog, "INSERT INTO requests")).toBe(false);
    expect(hasQuery(queryLog, "INSERT INTO sessions")).toBe(false);
    expect(validateBookableSlotMock).not.toHaveBeenCalled();
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(hasQuery(queryLog, "ROLLBACK")).toBe(true);
  });

  it("treats an inactive or archived package as unavailable through the active-package lookup", async () => {
    const { client, queryLog } = createPoolClient({ clientPackage: null });
    connectMock.mockResolvedValue(client);

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(createPackageBookingRequest(), res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toMatchObject({
      code: "invalid_package",
    });
    expect(findQuery(queryLog, "FROM client_service_packages")?.sql).toContain(
      "csp.status = 'active'"
    );
    expect(hasQuery(queryLog, "INSERT INTO requests")).toBe(false);
    expect(hasQuery(queryLog, "INSERT INTO sessions")).toBe(false);
    expect(validateBookableSlotMock).not.toHaveBeenCalled();
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
  });

  it("does not create a package booking when the slot is unavailable", async () => {
    const { client, queryLog } = createPoolClient();
    connectMock.mockResolvedValue(client);
    validateBookableSlotMock.mockResolvedValue({
      ok: false,
      reason: "slot_unavailable",
    });

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(createPackageBookingRequest(), res);

    expect(res.statusCode).toBe(409);
    expect(res.jsonBody).toMatchObject({
      code: "slot_unavailable",
    });
    expect(findQuery(queryLog, "FROM client_service_packages")).toBeDefined();
    expect(hasQuery(queryLog, "INSERT INTO requests")).toBe(false);
    expect(hasQuery(queryLog, "INSERT INTO sessions")).toBe(false);
    expect(hasQuery(queryLog, "UPDATE client_service_packages")).toBe(false);
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(hasQuery(queryLog, "ROLLBACK")).toBe(true);
  });

  it("keeps a successful package booking response when notifications fail", async () => {
    const { client } = createPoolClient({ sessionId: 902 });
    connectMock.mockResolvedValue(client);
    sendBookingNotificationsBoundedMock.mockRejectedValue(
      new Error("notification failure")
    );

    const handler = await loadHandler();
    const res = createMockResponse();

    await handler(createPackageBookingRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      booking: {
        sessionId: 902,
        clientPackage: {
          id: 801,
          remainingSessions: 2,
        },
      },
    });
  });
});
