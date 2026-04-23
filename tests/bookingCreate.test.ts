import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "./helpers/http";

const connectMock = vi.fn();
const validateBookableSlotMock = vi.fn();
const sendBookingNotificationsBoundedMock = vi.fn();

vi.mock("../server/db/pool", () => ({
  pool: {
    connect: connectMock,
  },
}));

vi.mock("../server/publicBooking/bookingAvailability", () => ({
  validateBookableSlot: validateBookableSlotMock,
}));

vi.mock("../server/publicBooking/sendBookingNotifications", () => ({
  sendBookingNotificationsBounded: sendBookingNotificationsBoundedMock,
}));

function mockValidSlot() {
  validateBookableSlotMock.mockResolvedValue({
    ok: true,
    service: {
      id: 1,
      title: "Consultation",
      durationMinutes: 60,
      price: 5000,
    },
    slot: {
      startsAt: "2026-04-20T12:00",
      endsAt: "2026-04-20T13:00",
    },
    selectedDate: "2026-04-20",
  });
}

function createValidRequest(overrides: Record<string, unknown> = {}) {
  return createMockRequest({
    method: "POST",
    body: {
      serviceId: 1,
      startsAt: "2026-04-20T12:00",
      firstName: "  Irina   Maria  ",
      lastName: "  Petrova  ",
      phone: "+7 (999) 123-45-67",
      email: "irina@example.com",
      message: "",
      consent: true,
      ...overrides,
    },
  });
}

function createPoolClient(options?: {
  existingClientId?: number | null;
  existingClientFirstRequestId?: number | null;
  createdClientId?: number;
  requestId?: number;
  sessionId?: number;
}) {
  const queryLog: { sql: string; values?: unknown[] }[] = [];
  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [] };
    }

    if (sql.includes("SELECT pg_advisory_xact_lock")) {
      return { rows: [] };
    }

    if (sql.includes("FROM clients")) {
      if (options?.existingClientId) {
        return {
          rows: [
            {
              id: options.existingClientId,
              name: "Existing Client",
              phone: "+7 999 000-00-00",
              email: "existing@example.com",
              source: "website",
              status: "active",
              first_request_id: options.existingClientFirstRequestId ?? null,
              created_at: "2026-04-01T09:00:00.000Z",
            },
          ],
        };
      }

      return { rows: [] };
    }

    if (sql.includes("INSERT INTO clients")) {
      return {
        rows: [
          {
            id: options?.createdClientId ?? 501,
          },
        ],
      };
    }

    if (sql.includes("INSERT INTO requests")) {
      return {
        rows: [
          {
            id: options?.requestId ?? 701,
          },
        ],
      };
    }

    if (sql.includes("UPDATE clients") && sql.includes("first_request_id IS NULL")) {
      return { rows: [] };
    }

    if (sql.includes("INSERT INTO sessions")) {
      return {
        rows: [
          {
            id: options?.sessionId ?? 901,
            scheduled_at: "2026-04-20T12:00:00.000Z",
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return {
    query,
    queryLog,
    release: vi.fn(),
  };
}

async function loadHandler() {
  const module = await import("../api/public/booking/create");
  return module.default;
}

describe("public booking create handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a request, client, and session for a new client", async () => {
    const poolClient = createPoolClient();
    connectMock.mockResolvedValue(poolClient);
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

    const handler = await loadHandler();
    const req = createValidRequest({ message: "Primary consultation" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      booking: {
        sessionId: 901,
        clientId: 501,
        serviceId: 1,
        serviceTitle: "Consultation",
        startsAt: "2026-04-20T12:00",
        endsAt: "2026-04-20T13:00",
      },
      alreadyExistedClient: false,
      notifications: {
        telegram: { status: "sent" },
        ownerEmail: { status: "sent" },
        clientEmail: { status: "sent" },
      },
    });

    const clientInsert = poolClient.queryLog.find((entry) =>
      entry.sql.includes("INSERT INTO clients")
    );
    const requestInsert = poolClient.queryLog.find((entry) =>
      entry.sql.includes("INSERT INTO requests")
    );
    const firstRequestUpdate = poolClient.queryLog.find((entry) =>
      entry.sql.includes("UPDATE clients")
    );
    const sessionInsert = poolClient.queryLog.find((entry) =>
      entry.sql.includes("INSERT INTO sessions")
    );

    expect(clientInsert).toBeDefined();
    expect(requestInsert?.values).toEqual([
      "Irina Maria Petrova",
      "+7 (999) 123-45-67",
      "irina@example.com",
      "Primary consultation",
      501,
    ]);
    expect(requestInsert?.sql).toContain("'booked'");
    expect(requestInsert?.sql).toContain("'website'");
    expect(firstRequestUpdate?.sql).toContain("first_request_id IS NULL");
    expect(firstRequestUpdate?.values).toEqual([501, 701]);
    expect(sessionInsert?.values?.[0]).toBe(501);
    expect(
      poolClient.queryLog.findIndex((entry) =>
        entry.sql.includes("INSERT INTO requests")
      )
    ).toBeLessThan(
      poolClient.queryLog.findIndex((entry) =>
        entry.sql.includes("INSERT INTO sessions")
      )
    );
    expect(poolClient.release).toHaveBeenCalledTimes(1);
  });

  it("creates a request and session for an existing client without creating another client", async () => {
    const poolClient = createPoolClient({
      existingClientId: 77,
      requestId: 702,
      sessionId: 902,
    });
    connectMock.mockResolvedValue(poolClient);
    mockValidSlot();
    sendBookingNotificationsBoundedMock.mockResolvedValue({
      completed: false,
      timeoutMs: 1500,
      reason: "timeout",
    });

    const handler = await loadHandler();
    const req = createValidRequest({
      phone: "+7 (999) 000-00-00",
      email: "existing@example.com",
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      booking: {
        sessionId: 902,
        clientId: 77,
        serviceId: 1,
        serviceTitle: "Consultation",
        startsAt: "2026-04-20T12:00",
        endsAt: "2026-04-20T13:00",
      },
      alreadyExistedClient: true,
    });
    expect(
      poolClient.queryLog.some((entry) => entry.sql.includes("INSERT INTO clients"))
    ).toBe(false);
    expect(
      poolClient.queryLog.find((entry) =>
        entry.sql.includes("INSERT INTO requests")
      )?.values
    ).toEqual([
      "Irina Maria Petrova",
      "+7 (999) 000-00-00",
      "existing@example.com",
      "",
      77,
    ]);
    expect(
      poolClient.queryLog.find((entry) =>
        entry.sql.includes("INSERT INTO sessions")
      )?.values?.[0]
    ).toBe(77);
  });

  it("updates first_request_id only when it is missing", async () => {
    const poolClient = createPoolClient({
      existingClientId: 77,
      existingClientFirstRequestId: 55,
      requestId: 703,
      sessionId: 904,
    });
    connectMock.mockResolvedValue(poolClient);
    mockValidSlot();
    sendBookingNotificationsBoundedMock.mockResolvedValue({
      completed: false,
      timeoutMs: 1500,
      reason: "timeout",
    });

    const handler = await loadHandler();
    const req = createValidRequest({
      phone: "+7 (999) 000-00-00",
      email: "existing@example.com",
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(
      poolClient.queryLog.find((entry) =>
        entry.sql.includes("UPDATE clients")
      )?.sql
    ).toContain("first_request_id IS NULL");
    expect(
      poolClient.queryLog.find((entry) =>
        entry.sql.includes("UPDATE clients")
      )?.values
    ).toEqual([77, 703]);
  });

  it("returns 400 for an invalid payload", async () => {
    const handler = await loadHandler();
    const req = createMockRequest({
      method: "POST",
      body: {
        serviceId: 0,
        consent: false,
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({
      code: "invalid_payload",
    });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("returns a service error when the service is invalid", async () => {
    const poolClient = createPoolClient();
    connectMock.mockResolvedValue(poolClient);
    validateBookableSlotMock.mockResolvedValue({
      ok: false,
      reason: "invalid_service",
    });

    const handler = await loadHandler();
    const req = createValidRequest({ serviceId: 999 });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({
      code: "invalid_service",
    });
  });

  it("does not create request or session for a slot conflict", async () => {
    const poolClient = createPoolClient();
    connectMock.mockResolvedValue(poolClient);
    validateBookableSlotMock.mockResolvedValue({
      ok: false,
      reason: "slot_unavailable",
    });

    const handler = await loadHandler();
    const req = createValidRequest();
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.jsonBody).toMatchObject({
      code: "slot_unavailable",
    });
    expect(
      poolClient.queryLog.some((entry) => entry.sql.includes("INSERT INTO requests"))
    ).toBe(false);
    expect(
      poolClient.queryLog.some((entry) => entry.sql.includes("INSERT INTO sessions"))
    ).toBe(false);
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
  });

  it("keeps a successful booking response when notifications fail", async () => {
    const poolClient = createPoolClient({ sessionId: 903 });
    connectMock.mockResolvedValue(poolClient);
    mockValidSlot();
    sendBookingNotificationsBoundedMock.mockRejectedValue(
      new Error("notification failure")
    );

    const handler = await loadHandler();
    const req = createValidRequest();
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      booking: {
        sessionId: 903,
      },
    });
  });

  it("runs bounded notifications after commit", async () => {
    const poolClient = createPoolClient({ requestId: 704, sessionId: 905 });
    connectMock.mockResolvedValue(poolClient);
    mockValidSlot();
    sendBookingNotificationsBoundedMock.mockImplementation(async () => {
      expect(poolClient.queryLog[poolClient.queryLog.length - 1]?.sql).toBe(
        "COMMIT"
      );

      return {
        completed: true,
        timeoutMs: 1500,
        notifications: {
          telegram: { status: "sent" },
          ownerEmail: { status: "sent" },
          clientEmail: { status: "sent" },
        },
      };
    });

    const handler = await loadHandler();
    const req = createValidRequest();
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(sendBookingNotificationsBoundedMock).toHaveBeenCalledTimes(1);
  });
});
