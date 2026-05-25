import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "./helpers/http";

const {
  connectMock,
  resendSendMock,
  ResendMock,
  processSessionRemindersMock,
} = vi.hoisted(() => {
  const resendSendMock = vi.fn();

  const ResendMock = vi.fn(function Resend() {
    return {
      emails: {
        send: resendSendMock,
      },
    };
  });

  return {
    connectMock: vi.fn(),
    resendSendMock,
    ResendMock,
    processSessionRemindersMock: vi.fn(),
  };
});

vi.mock("../server/db/pool", () => ({
  pool: {
    connect: connectMock,
  },
}));

vi.mock("resend", () => ({
  Resend: ResendMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type ReminderCandidateRow = {
  session_id: number | string;
  client_name: string;
  client_phone: string;
  client_email: string;
  preferred_contact_method: string;
  preferred_contact_value: string;
  service_title: string;
  scheduled_at: string;
  duration_minutes: number | string;
  notes: string | null;
};

type MockDbOptions = {
  lockAcquired?: boolean;
  timezone?: string | null;
  oneHourCandidates?: ReminderCandidateRow[];
  dayAheadCandidates?: ReminderCandidateRow[];
  existingDeliveries?: Set<string>;
};

const fetchMock = vi.fn();

const reminderPayload = {
  sessionId: 901,
  clientName: "Irina Petrova",
  clientPhone: "+7 (999) 123-45-67",
  clientEmail: "irina@example.com",
  preferredContact: "Telegram: @irina_test",
  serviceTitle: "Individual consultation",
  startsAt: "2026-04-20T09:00:00.000Z",
  endsAt: "2026-04-20T10:00:00.000Z",
  timezone: "Europe/Moscow",
  notes: "Bring previous notes",
};

const oneHourCandidate: ReminderCandidateRow = {
  session_id: 901,
  client_name: "Irina Petrova",
  client_phone: "+7 (999) 123-45-67",
  client_email: "irina@example.com",
  preferred_contact_method: "telegram",
  preferred_contact_value: "@irina_test",
  service_title: "Individual consultation",
  scheduled_at: "2026-04-20T09:00:00.000Z",
  duration_minutes: 60,
  notes: "Bring previous notes",
};

const secondOneHourCandidate: ReminderCandidateRow = {
  ...oneHourCandidate,
  session_id: 902,
  client_name: "Anna Smirnova",
  client_phone: "+7 (900) 000-00-00",
  client_email: "anna@example.com",
  preferred_contact_value: "@anna_test",
  notes: "Second session",
};

function setReminderEnv() {
  process.env.RESEND_API_KEY = "test_resend_key";
  process.env.OWNER_EMAIL = "owner@example.com";
  process.env.TELEGRAM_TOKEN = "test_telegram_token";
  process.env.TELEGRAM_CHAT_ID = "123456";
}

function clearReminderEnv() {
  delete process.env.RESEND_API_KEY;
  delete process.env.OWNER_EMAIL;
  delete process.env.TELEGRAM_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  delete process.env.CRON_SECRET;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function createMockDb(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];

  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql.includes("pg_try_advisory_lock")) {
      return {
        rows: [
          {
            acquired: options.lockAcquired ?? true,
          },
        ],
      };
    }

    if (sql.includes("pg_advisory_unlock")) {
      return { rows: [] };
    }

    if (sql.includes("FROM booking_settings")) {
      return {
        rows: [
          {
            timezone: options.timezone ?? "Europe/Moscow",
          },
        ],
      };
    }

    if (
      sql.includes("FROM sessions s") &&
      sql.includes("INNER JOIN clients") &&
      sql.includes("INNER JOIN services")
    ) {
      if (values?.[0] === 55 && values?.[1] === 65) {
        return {
          rows: options.oneHourCandidates ?? [],
        };
      }

      if (values?.[0] === 1435 && values?.[1] === 1445) {
        return {
          rows: options.dayAheadCandidates ?? [],
        };
      }
    }

    if (sql.includes("FROM session_reminder_deliveries")) {
      const key = `${values?.[0]}:${values?.[1]}`;

      return {
        rows: [
          {
            exists: options.existingDeliveries?.has(key) ?? false,
          },
        ],
      };
    }

    if (sql.includes("INSERT INTO session_reminder_deliveries")) {
      return { rows: [] };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return {
    client: {
      query,
      release: vi.fn(),
    } as unknown as PoolClient & { release: ReturnType<typeof vi.fn> },
    queryLog,
    query,
  };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

function findQueries(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.filter((entry) => entry.sql.includes(fragment));
}

async function loadNotificationService() {
  const module = await import(
    "../server/reminders/sendSessionReminderNotifications"
  );

  return module;
}

async function loadProcessorService() {
  const module = await import("../server/reminders/processSessionReminders");

  return module.processSessionReminders;
}

async function loadSessionsHandlerWithMockedProcessor() {
  vi.resetModules();
  vi.doMock("../server/reminders/processSessionReminders", () => ({
    processSessionReminders: processSessionRemindersMock,
  }));

  const module = await import("../api/admin/sessions");

  return module.default;
}

describe("sendSessionReminderNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearReminderEnv();
    setReminderEnv();

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "",
    });
    resendSendMock.mockResolvedValue({
      error: null,
    });
  });

  it("sends specialist Telegram and owner email reminder with session details", async () => {
    const { sendSessionReminderNotifications } = await loadNotificationService();

    const result = await sendSessionReminderNotifications(
      "specialist_1h",
      reminderPayload
    );

    expect(result).toEqual({
      telegram: {
        status: "sent",
      },
      ownerEmail: {
        status: "sent",
      },
      clientEmail: {
        status: "skipped",
        error: "Client email reminder is not used for this reminder type",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottest_telegram_token/sendMessage",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    const telegramRequest = fetchMock.mock.calls[0]?.[1] as
      | { body?: string }
      | undefined;
    const telegramBody = JSON.parse(telegramRequest?.body ?? "{}");
    const telegramText = normalizeSpaces(String(telegramBody.text ?? ""));

    expect(telegramBody).toMatchObject({
      chat_id: "123456",
    });
    expect(telegramText).toContain("Irina Petrova");
    expect(telegramText).toContain("+7 (999) 123-45-67");
    expect(telegramText).toContain("irina@example.com");
    expect(telegramText).toContain("Telegram: @irina_test");
    expect(telegramText).toContain("Individual consultation");
    expect(telegramText).toContain("20");
    expect(telegramText).toContain("12:00 - 13:00");
    expect(telegramText).toContain("Europe/Moscow");
    expect(telegramText).toContain("Bring previous notes");

    expect(ResendMock).toHaveBeenCalledWith("test_resend_key");
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Website <onboarding@resend.dev>",
        to: ["owner@example.com"],
        subject: expect.stringContaining("12:00 - 13:00"),
        html: expect.stringContaining("Bring previous notes"),
      })
    );
  });

  it("skips external calls when notification environment variables are missing", async () => {
    clearReminderEnv();
    const { sendSessionReminderNotifications } = await loadNotificationService();

    const result = await sendSessionReminderNotifications(
      "specialist_24h",
      reminderPayload
    );

    expect(result).toEqual({
      telegram: {
        status: "skipped",
        error: "Missing Telegram environment variables",
      },
      ownerEmail: {
        status: "skipped",
        error: "Missing RESEND_API_KEY",
      },
      clientEmail: {
        status: "skipped",
        error: "Missing RESEND_API_KEY",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ResendMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("returns failed channel status without breaking the other notification channel", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => "telegram api error",
    });
    const { sendSessionReminderNotifications } = await loadNotificationService();

    const result = await sendSessionReminderNotifications(
      "specialist_1h",
      reminderPayload
    );

    expect(result.telegram).toEqual({
      status: "failed",
      error: "telegram api error",
    });
    expect(result.ownerEmail).toEqual({
      status: "sent",
    });
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });
});

describe("processSessionReminders", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    clearReminderEnv();
    setReminderEnv();

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "",
    });
    resendSendMock.mockResolvedValue({
      error: null,
    });
  });

  it("processes due scheduled sessions and persists specialist/client reminder deliveries", async () => {
    const { client, queryLog } = createMockDb({
      oneHourCandidates: [oneHourCandidate],
    });
    connectMock.mockResolvedValue(client);

    const processSessionReminders = await loadProcessorService();
    const result = await processSessionReminders();

    expect(result).toMatchObject({
      success: true,
      lockAcquired: true,
      batches: [
        {
          key: "1h",
          candidateSessions: 1,
          attemptedReminders: 2,
          skippedExisting: 0,
          sentChannels: 3,
          failedChannels: 0,
          skippedChannels: 0,
        },
        {
          key: "24h",
          candidateSessions: 0,
          attemptedReminders: 0,
        },
      ],
    });

    const candidateQueries = findQueries(queryLog, "FROM sessions s");
    expect(candidateQueries[0]?.values).toEqual([55, 65]);
    expect(candidateQueries[0]?.sql).toContain("s.status = 'scheduled'");
    expect(candidateQueries[1]?.values).toEqual([1435, 1445]);

    const deliveryInserts = findQueries(
      queryLog,
      "INSERT INTO session_reminder_deliveries"
    );
    expect(deliveryInserts.map((entry) => entry.values)).toEqual([
      [901, "specialist_1h", "telegram", "sent", null],
      [901, "specialist_1h", "owner_email", "sent", null],
      [901, "client_1h", "client_email", "sent", null],
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock).toHaveBeenCalledTimes(2);
    expect(findQuery(queryLog, "pg_advisory_unlock")).toBeDefined();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("does not send reminders when no sessions are selected in reminder windows", async () => {
    const { client, queryLog } = createMockDb();
    connectMock.mockResolvedValue(client);

    const processSessionReminders = await loadProcessorService();
    const result = await processSessionReminders();

    expect(result.batches).toMatchObject([
      {
        key: "1h",
        candidateSessions: 0,
        attemptedReminders: 0,
      },
      {
        key: "24h",
        candidateSessions: 0,
        attemptedReminders: 0,
      },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(
      findQueries(queryLog, "INSERT INTO session_reminder_deliveries")
    ).toHaveLength(0);
    expect(findQueries(queryLog, "FROM sessions s").map((entry) => entry.values)).toEqual([
      [55, 65],
      [1435, 1445],
    ]);
    expect(findQuery(queryLog, "FROM sessions s")?.sql).toContain(
      "s.status = 'scheduled'"
    );
  });

  it("does not duplicate reminders that already have delivery records", async () => {
    const { client, queryLog } = createMockDb({
      oneHourCandidates: [oneHourCandidate],
      existingDeliveries: new Set(["901:specialist_1h", "901:client_1h"]),
    });
    connectMock.mockResolvedValue(client);

    const processSessionReminders = await loadProcessorService();
    const result = await processSessionReminders();

    expect(result.batches[0]).toMatchObject({
      key: "1h",
      candidateSessions: 1,
      attemptedReminders: 0,
      skippedExisting: 2,
      sentChannels: 0,
      failedChannels: 0,
      skippedChannels: 0,
    });
    expect(findQueries(queryLog, "FROM session_reminder_deliveries")).toHaveLength(
      2
    );
    expect(
      findQueries(queryLog, "INSERT INTO session_reminder_deliveries")
    ).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("persists failed channel statuses and continues processing other reminders", async () => {
    const { client, queryLog } = createMockDb({
      oneHourCandidates: [oneHourCandidate, secondOneHourCandidate],
    });
    connectMock.mockResolvedValue(client);
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => "telegram api error",
    });

    const processSessionReminders = await loadProcessorService();
    const result = await processSessionReminders();

    expect(result.batches[0]).toMatchObject({
      key: "1h",
      candidateSessions: 2,
      attemptedReminders: 4,
      skippedExisting: 0,
      sentChannels: 4,
      failedChannels: 2,
      skippedChannels: 0,
    });

    const deliveryInserts = findQueries(
      queryLog,
      "INSERT INTO session_reminder_deliveries"
    );
    expect(deliveryInserts).toHaveLength(6);
    expect(deliveryInserts[0]?.values).toEqual([
      901,
      "specialist_1h",
      "telegram",
      "failed",
      "telegram api error",
    ]);
    expect(deliveryInserts[3]?.values).toEqual([
      902,
      "specialist_1h",
      "telegram",
      "failed",
      "telegram api error",
    ]);
    expect(resendSendMock).toHaveBeenCalledTimes(4);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("returns a safe result without processing when another reminder run owns the lock", async () => {
    const { client, queryLog } = createMockDb({
      lockAcquired: false,
      oneHourCandidates: [oneHourCandidate],
    });
    connectMock.mockResolvedValue(client);

    const processSessionReminders = await loadProcessorService();
    const result = await processSessionReminders();

    expect(result).toMatchObject({
      success: true,
      lockAcquired: false,
      reason: "already_running",
      batches: [],
    });
    expect(findQuery(queryLog, "FROM sessions s")).toBeUndefined();
    expect(findQuery(queryLog, "pg_advisory_unlock")).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

describe("admin sessions process-reminders endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearReminderEnv();
    processSessionRemindersMock.mockResolvedValue({
      success: true,
      lockAcquired: true,
      processedAt: "2026-04-20T08:00:00.000Z",
      batches: [],
    });
  });

  it("rejects unsupported methods before running reminders", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const handler = await loadSessionsHandlerWithMockedProcessor();
    const req = createMockRequest({
      method: "PUT",
      query: { action: "process-reminders" },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.jsonBody).toEqual({ error: "Method not allowed" });
    expect(processSessionRemindersMock).not.toHaveBeenCalled();
  });

  it("requires CRON_SECRET and a matching x-cron-secret header", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const handler = await loadSessionsHandlerWithMockedProcessor();
    const req = createMockRequest({
      method: "POST",
      query: { action: "process-reminders" },
      headers: {
        "x-cron-secret": "wrong-secret",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: "Unauthorized" });
    expect(processSessionRemindersMock).not.toHaveBeenCalled();
  });

  it("runs the reminder processor for an authorized cron request", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const handler = await loadSessionsHandlerWithMockedProcessor();
    const req = createMockRequest({
      method: "POST",
      query: { action: "process-reminders" },
      headers: {
        "x-cron-secret": "cron-secret",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      success: true,
      lockAcquired: true,
      processedAt: "2026-04-20T08:00:00.000Z",
      batches: [],
    });
    expect(processSessionRemindersMock).toHaveBeenCalledTimes(1);
  });
});
