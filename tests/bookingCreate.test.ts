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

function createPoolClient(options?: {
  existingClientId?: number | null;
  createdClientId?: number;
  sessionId?: number;
}) {
  const queryLog: string[] = [];
  const query = vi.fn(async (sql: string) => {
    queryLog.push(sql);

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
              name: "Существующий клиент",
              phone: "+7 999 000-00-00",
              email: "existing@example.com",
              source: "website",
              status: "active",
              first_request_id: null,
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

  it("creates a booking, creates a session, and creates a new client when needed", async () => {
    const poolClient = createPoolClient();
    connectMock.mockResolvedValue(poolClient);
    validateBookableSlotMock.mockResolvedValue({
      ok: true,
      service: {
        id: 1,
        title: "Консультация",
        durationMinutes: 60,
        price: 5000,
      },
      slot: {
        startsAt: "2026-04-20T12:00",
        endsAt: "2026-04-20T13:00",
      },
      selectedDate: "2026-04-20",
    });
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
    const req = createMockRequest({
      method: "POST",
      body: {
        serviceId: 1,
        startsAt: "2026-04-20T12:00",
        name: "Ирина",
        phone: "+7 (999) 123-45-67",
        email: "irina@example.com",
        message: "Первичная консультация",
        consent: true,
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      booking: {
        sessionId: 901,
        clientId: 501,
        serviceId: 1,
        serviceTitle: "Консультация",
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
    expect(poolClient.queryLog.some((sql) => sql.includes("INSERT INTO clients"))).toBe(true);
    expect(poolClient.queryLog.some((sql) => sql.includes("INSERT INTO sessions"))).toBe(true);
    expect(poolClient.release).toHaveBeenCalledTimes(1);
  });

  it("reuses an existing client found by phone or email", async () => {
    const poolClient = createPoolClient({ existingClientId: 77, sessionId: 902 });
    connectMock.mockResolvedValue(poolClient);
    validateBookableSlotMock.mockResolvedValue({
      ok: true,
      service: {
        id: 1,
        title: "Консультация",
        durationMinutes: 60,
        price: 5000,
      },
      slot: {
        startsAt: "2026-04-20T12:00",
        endsAt: "2026-04-20T13:00",
      },
      selectedDate: "2026-04-20",
    });
    sendBookingNotificationsBoundedMock.mockResolvedValue({
      completed: false,
      timeoutMs: 1500,
      reason: "timeout",
    });

    const handler = await loadHandler();
    const req = createMockRequest({
      method: "POST",
      body: {
        serviceId: 1,
        startsAt: "2026-04-20T12:00",
        name: "Ирина",
        phone: "+7 (999) 000-00-00",
        email: "existing@example.com",
        message: "",
        consent: true,
      },
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
        serviceTitle: "Консультация",
        startsAt: "2026-04-20T12:00",
        endsAt: "2026-04-20T13:00",
      },
      alreadyExistedClient: true,
    });
    expect(poolClient.queryLog.some((sql) => sql.includes("INSERT INTO clients"))).toBe(false);
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
    const req = createMockRequest({
      method: "POST",
      body: {
        serviceId: 999,
        startsAt: "2026-04-20T12:00",
        name: "Ирина",
        phone: "+7 (999) 123-45-67",
        email: "irina@example.com",
        message: "",
        consent: true,
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({
      code: "invalid_service",
    });
  });

  it("returns 409 for a slot conflict", async () => {
    const poolClient = createPoolClient();
    connectMock.mockResolvedValue(poolClient);
    validateBookableSlotMock.mockResolvedValue({
      ok: false,
      reason: "slot_unavailable",
    });

    const handler = await loadHandler();
    const req = createMockRequest({
      method: "POST",
      body: {
        serviceId: 1,
        startsAt: "2026-04-20T12:00",
        name: "Ирина",
        phone: "+7 (999) 123-45-67",
        email: "irina@example.com",
        message: "",
        consent: true,
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.jsonBody).toMatchObject({
      code: "slot_unavailable",
    });
  });

  it("keeps a successful booking response when notifications fail", async () => {
    const poolClient = createPoolClient({ sessionId: 903 });
    connectMock.mockResolvedValue(poolClient);
    validateBookableSlotMock.mockResolvedValue({
      ok: true,
      service: {
        id: 1,
        title: "Консультация",
        durationMinutes: 60,
        price: 5000,
      },
      slot: {
        startsAt: "2026-04-20T12:00",
        endsAt: "2026-04-20T13:00",
      },
      selectedDate: "2026-04-20",
    });
    sendBookingNotificationsBoundedMock.mockRejectedValue(new Error("notification failure"));

    const handler = await loadHandler();
    const req = createMockRequest({
      method: "POST",
      body: {
        serviceId: 1,
        startsAt: "2026-04-20T12:00",
        name: "Ирина",
        phone: "+7 (999) 123-45-67",
        email: "irina@example.com",
        message: "",
        consent: true,
      },
    });
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
});
