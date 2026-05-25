import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../helpers/http";

const {
  poolQueryMock,
  connectMock,
  requireAdminRequestMock,
  processSessionRemindersMock,
} = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  connectMock: vi.fn(),
  requireAdminRequestMock: vi.fn(),
  processSessionRemindersMock: vi.fn(),
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
    connect: connectMock,
  },
}));

vi.mock("../../server/auth/requireAdmin", () => ({
  requireAdminRequest: requireAdminRequestMock,
}));

vi.mock("../../server/reminders/processSessionReminders", () => ({
  processSessionReminders: processSessionRemindersMock,
}));

function denyAdmin() {
  requireAdminRequestMock.mockImplementation((_req, res) => {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  });
}

function allowAdmin() {
  requireAdminRequestMock.mockReturnValue(true);
}

async function loadHandler(path: string) {
  const module = await import(path);
  return module.default;
}

describe("admin endpoint authorization protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    denyAdmin();
    processSessionRemindersMock.mockResolvedValue({
      success: true,
      lockAcquired: true,
      processedAt: "2027-06-01T09:00:00.000Z",
      batches: [],
    });
  });

  it("blocks schedule POST actions before DB access when admin is unauthorized", async () => {
    const handler = await loadHandler("../../api/admin/schedule");

    for (const [action, body] of [
      [
        "update",
        {
          settings: {
            minAdvanceHours: 24,
            bufferMinutes: 30,
            allowSameDayBooking: false,
            maxDaysAhead: 60,
            timezone: "Europe/Moscow",
          },
          rules: [],
        },
      ],
      [
        "create-blocked-slot",
        {
          blockedDate: "2027-06-20",
          startTime: "12:00",
          endTime: "13:00",
          reason: "Lunch",
        },
      ],
      [
        "create-override",
        {
          date: "2027-06-20",
          isWorkingDay: true,
          startTime: "12:00",
          endTime: "16:00",
        },
      ],
    ] as const) {
      const req = createMockRequest({
        method: "POST",
        query: { action },
        body,
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.jsonBody).toEqual({ error: "Unauthorized" });
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("blocks clients admin actions before DB access when admin is unauthorized", async () => {
    const handler = await loadHandler("../../api/admin/clients");

    for (const req of [
      createMockRequest({
        method: "GET",
        query: { action: "list-packages", clientId: "501" },
      }),
      createMockRequest({
        method: "POST",
        query: { action: "create" },
        body: {
          name: "Irina Petrova",
          phone: "+79189990099",
          preferredContactMethod: "telegram",
          preferredContactValue: "@irina_test",
        },
      }),
      createMockRequest({
        method: "POST",
        query: { action: "update" },
        body: {
          id: 501,
          name: "Irina Petrova",
          phone: "+79189990099",
          status: "active",
          preferredContactMethod: "telegram",
          preferredContactValue: "@irina_test",
        },
      }),
      createMockRequest({
        method: "POST",
        query: { action: "create-from-request" },
        body: { requestId: 301 },
      }),
    ]) {
      const res = createMockResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(401);
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("blocks sessions mutations while preserving CRON_SECRET authorization for process-reminders", async () => {
    const handler = await loadHandler("../../api/admin/sessions");

    for (const [action, body] of [
      [
        "create",
        {
          clientId: 501,
          serviceId: 1,
          scheduledAt: "2027-06-20T12:00:00.000Z",
          durationMinutes: 60,
          price: 5000,
          status: "scheduled",
        },
      ],
      [
        "update",
        {
          id: 901,
          clientId: 501,
          serviceId: 1,
          scheduledAt: "2027-06-20T12:00:00.000Z",
          durationMinutes: 60,
          price: 5000,
          status: "scheduled",
        },
      ],
      ["delete", { id: 901 }],
    ] as const) {
      const res = createMockResponse();

      await handler(
        createMockRequest({
          method: "POST",
          query: { action },
          body,
        }),
        res
      );

      expect(res.statusCode).toBe(401);
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
    expect(processSessionRemindersMock).not.toHaveBeenCalled();

    process.env.CRON_SECRET = "cron-secret";
    const badCronRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "process-reminders" },
        headers: { "x-cron-secret": "wrong" },
      }),
      badCronRes
    );

    expect(badCronRes.statusCode).toBe(401);
    expect(processSessionRemindersMock).not.toHaveBeenCalled();
    expect(requireAdminRequestMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        query: { action: "process-reminders" },
      }),
      expect.anything()
    );

    const goodCronRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "process-reminders" },
        headers: { "x-cron-secret": "cron-secret" },
      }),
      goodCronRes
    );

    expect(goodCronRes.statusCode).toBe(200);
    expect(goodCronRes.jsonBody).toMatchObject({
      success: true,
      lockAcquired: true,
    });
    expect(processSessionRemindersMock).toHaveBeenCalledTimes(1);
  });

  it("blocks services mutations before DB access when admin is unauthorized", async () => {
    const handler = await loadHandler("../../api/admin/services");

    for (const req of [
      createMockRequest({ method: "GET" }),
      createMockRequest({
        method: "POST",
        query: { action: "create" },
        body: {
          title: "Consultation",
          description: "Session",
          price: 5000,
          durationMinutes: 60,
          isActive: true,
        },
      }),
      createMockRequest({
        method: "POST",
        query: { action: "create-package-plan" },
        body: {
          serviceId: 1,
          title: "Package",
          sessionsCount: 4,
          price: 14000,
          isActive: true,
        },
      }),
    ]) {
      const res = createMockResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(401);
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("blocks notes and requests admin actions before DB access when admin is unauthorized", async () => {
    const notesHandler = await loadHandler("../../api/admin/notes");
    const requestsHandler = await loadHandler("../../api/admin/requests");

    for (const [handler, req] of [
      [
        notesHandler,
        createMockRequest({
          method: "POST",
          query: { action: "create" },
          body: {
            clientId: 501,
            content: "Private note",
          },
        }),
      ],
      [
        notesHandler,
        createMockRequest({
          method: "POST",
          query: { action: "delete" },
          body: { id: 701 },
        }),
      ],
      [
        requestsHandler,
        createMockRequest({
          method: "GET",
        }),
      ],
      [
        requestsHandler,
        createMockRequest({
          method: "POST",
          query: { action: "update" },
          body: {
            id: 301,
            status: "processed",
          },
        }),
      ],
    ] as const) {
      const res = createMockResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(401);
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("allows protected admin handler to reach DB when requireAdminRequest approves", async () => {
    allowAdmin();
    poolQueryMock.mockResolvedValueOnce({
      rows: [],
    });

    const handler = await loadHandler("../../api/admin/requests");
    const res = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), res);

    expect(res.statusCode).toBe(200);
    expect(poolQueryMock).toHaveBeenCalledTimes(1);
  });
});
