import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../helpers/http";

const { poolQueryMock, connectMock, requireAdminRequestMock } = vi.hoisted(
  () => ({
    poolQueryMock: vi.fn(),
    connectMock: vi.fn(),
    requireAdminRequestMock: vi.fn(),
  })
);

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
    connect: connectMock,
  },
}));

vi.mock("../../server/auth/requireAdmin", () => ({
  requireAdminRequest: requireAdminRequestMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type SettingsRow = {
  min_advance_hours: number | string;
  buffer_minutes: number | string;
  allow_same_day_booking: boolean;
  max_days_ahead: number | string;
  timezone: string | null;
};

type RuleRow = {
  weekday: number | string;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
};

type OverrideRow = {
  override_date: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string;
};

type BlockedSlotRow = {
  id: number | string;
  blocked_date: string | Date;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
};

type MockDbOptions = {
  settings?: SettingsRow[];
  rules?: RuleRow[];
  overrides?: OverrideRow[];
  blockedSlots?: BlockedSlotRow[];
  createdOverride?: OverrideRow;
  updatedOverride?: OverrideRow | null;
  deletedOverrideDate?: string | null;
  blockedOverlap?: boolean;
  createdBlockedSlot?: BlockedSlotRow;
  updatedBlockedSlot?: BlockedSlotRow | null;
  deletedBlockedSlotId?: number | string | null;
};

const settingsRows: SettingsRow[] = [
  {
    min_advance_hours: "12",
    buffer_minutes: "15",
    allow_same_day_booking: true,
    max_days_ahead: "45",
    timezone: "Asia/Tomsk",
  },
];

const ruleRows: RuleRow[] = [
  { weekday: 1, is_enabled: true, start_time: "10:00:00", end_time: "18:00:00" },
  { weekday: 2, is_enabled: true, start_time: "10:00:00", end_time: "18:00:00" },
  { weekday: 3, is_enabled: true, start_time: "10:00:00", end_time: "18:00:00" },
  { weekday: 4, is_enabled: true, start_time: "10:00:00", end_time: "18:00:00" },
  { weekday: 5, is_enabled: true, start_time: "10:00:00", end_time: "17:00:00" },
  { weekday: 6, is_enabled: false, start_time: "10:00:00", end_time: "10:00:00" },
  { weekday: 7, is_enabled: false, start_time: "10:00:00", end_time: "10:00:00" },
];

const overrideRows: OverrideRow[] = [
  {
    override_date: "2027-06-10",
    is_working_day: true,
    start_time: "11:00:00",
    end_time: "15:00:00",
    note: "Conference day",
  },
  {
    override_date: "2027-06-11",
    is_working_day: false,
    start_time: null,
    end_time: null,
    note: "Day off",
  },
];

const blockedSlotRows: BlockedSlotRow[] = [
  {
    id: "22",
    blocked_date: "2027-06-12",
    start_time: "12:00:00",
    end_time: "13:30:00",
    reason: "Personal",
    created_at: "2027-06-01T09:00:00.000Z",
  },
];

function createSchedulePayload(overrides: Record<string, unknown> = {}) {
  return {
    settings: {
      minAdvanceHours: 24,
      bufferMinutes: 30,
      allowSameDayBooking: false,
      maxDaysAhead: 60,
      timezone: "Europe/Samara",
    },
    rules: [
      { weekday: 1, isEnabled: true, startTime: "09:00", endTime: "17:00" },
      { weekday: 2, isEnabled: true, startTime: "09:00", endTime: "17:00" },
      { weekday: 3, isEnabled: true, startTime: "09:00", endTime: "17:00" },
      { weekday: 4, isEnabled: true, startTime: "09:00", endTime: "17:00" },
      { weekday: 5, isEnabled: true, startTime: "09:00", endTime: "16:00" },
      { weekday: 6, isEnabled: false, startTime: "10:00", endTime: "10:00" },
      { weekday: 7, isEnabled: false, startTime: "10:00", endTime: "10:00" },
    ],
    ...overrides,
  };
}

function createMockDb(options: MockDbOptions = {}) {
  const poolQueryLog: QueryLogEntry[] = [];
  const clientQueryLog: QueryLogEntry[] = [];

  const handleQuery = async (
    sql: string,
    values: unknown[] | undefined,
    queryLog: QueryLogEntry[]
  ) => {
    queryLog.push({ sql, values });

    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [] };
    }

    if (
      sql.includes("INSERT INTO booking_settings") &&
      sql.includes("ON CONFLICT")
    ) {
      return { rows: [] };
    }

    if (
      sql.includes("INSERT INTO schedule_rules") &&
      sql.includes("ON CONFLICT")
    ) {
      return { rows: [] };
    }

    if (sql.includes("FROM booking_settings")) {
      return { rows: options.settings ?? settingsRows };
    }

    if (sql.includes("FROM schedule_rules")) {
      return { rows: options.rules ?? ruleRows };
    }

    if (sql.includes("FROM blocked_slots") && sql.includes("ORDER BY")) {
      return { rows: options.blockedSlots ?? blockedSlotRows };
    }

    if (sql.includes("INSERT INTO schedule_overrides")) {
      return {
        rows: [
          options.createdOverride ?? {
            override_date: values?.[0] as string,
            is_working_day: values?.[1] as boolean,
            start_time: values?.[2] as string | null,
            end_time: values?.[3] as string | null,
            note: values?.[4] as string,
          },
        ],
      };
    }

    if (sql.includes("UPDATE schedule_overrides")) {
      return {
        rows:
          options.updatedOverride === null
            ? []
            : [
                options.updatedOverride ?? {
                  override_date: values?.[1] as string,
                  is_working_day: values?.[2] as boolean,
                  start_time: values?.[3] as string | null,
                  end_time: values?.[4] as string | null,
                  note: values?.[5] as string,
                },
              ],
      };
    }

    if (sql.includes("DELETE FROM schedule_overrides")) {
      return {
        rows:
          options.deletedOverrideDate === null
            ? []
            : [{ override_date: options.deletedOverrideDate ?? values?.[0] }],
      };
    }

    if (sql.includes("FROM schedule_overrides")) {
      return { rows: options.overrides ?? overrideRows };
    }

    if (
      sql.includes("FROM blocked_slots") &&
      sql.includes("NOT (end_time <= $2 OR start_time >= $3)")
    ) {
      return {
        rows: options.blockedOverlap ? [{ id: 999 }] : [],
      };
    }

    if (sql.includes("INSERT INTO blocked_slots")) {
      return {
        rows: [
          options.createdBlockedSlot ?? {
            id: "31",
            blocked_date: values?.[0] as string,
            start_time: values?.[1] as string,
            end_time: values?.[2] as string,
            reason: values?.[3] as string,
            created_at: "2027-06-02T09:00:00.000Z",
          },
        ],
      };
    }

    if (sql.includes("UPDATE blocked_slots")) {
      return {
        rows:
          options.updatedBlockedSlot === null
            ? []
            : [
                options.updatedBlockedSlot ?? {
                  id: values?.[0] as number,
                  blocked_date: values?.[1] as string,
                  start_time: values?.[2] as string,
                  end_time: values?.[3] as string,
                  reason: values?.[4] as string,
                  created_at: "2027-06-02T09:00:00.000Z",
                },
              ],
      };
    }

    if (sql.includes("DELETE FROM blocked_slots")) {
      return {
        rows:
          options.deletedBlockedSlotId === null
            ? []
            : [{ id: options.deletedBlockedSlotId ?? values?.[0] }],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  };

  poolQueryMock.mockImplementation((sql: string, values?: unknown[]) =>
    handleQuery(sql, values, poolQueryLog)
  );

  const client = {
    query: vi.fn((sql: string, values?: unknown[]) =>
      handleQuery(sql, values, clientQueryLog)
    ),
    release: vi.fn(),
  };

  connectMock.mockResolvedValue(client);

  return {
    poolQueryLog,
    clientQueryLog,
    client,
  };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

function findQueries(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.filter((entry) => entry.sql.includes(fragment));
}

async function loadScheduleHandler() {
  const module = await import("../../api/admin/schedule");
  return module.default;
}

describe("admin schedule API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
  });

  it("returns schedule overview with settings, rules, overrides and blocked slots", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();
    const req = createMockRequest({ method: "GET" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      settings: {
        minAdvanceHours: 12,
        bufferMinutes: 15,
        allowSameDayBooking: true,
        maxDaysAhead: 45,
        timezone: "Asia/Tomsk",
      },
      rules: [
        { weekday: 1, isEnabled: true, startTime: "10:00", endTime: "18:00" },
        { weekday: 2, isEnabled: true, startTime: "10:00", endTime: "18:00" },
        { weekday: 3, isEnabled: true, startTime: "10:00", endTime: "18:00" },
        { weekday: 4, isEnabled: true, startTime: "10:00", endTime: "18:00" },
        { weekday: 5, isEnabled: true, startTime: "10:00", endTime: "17:00" },
        { weekday: 6, isEnabled: false, startTime: "10:00", endTime: "10:00" },
        { weekday: 7, isEnabled: false, startTime: "10:00", endTime: "10:00" },
      ],
      overrides: [
        {
          date: "2027-06-10",
          isWorkingDay: true,
          startTime: "11:00",
          endTime: "15:00",
          note: "Conference day",
        },
        {
          date: "2027-06-11",
          isWorkingDay: false,
          startTime: null,
          endTime: null,
          note: "Day off",
        },
      ],
      blockedSlots: [
        {
          id: 22,
          blockedDate: "2027-06-12",
          startTime: "12:00",
          endTime: "13:30",
          reason: "Personal",
          createdAt: "2027-06-01T09:00:00.000Z",
        },
      ],
    });
    expect(requireAdminRequestMock).toHaveBeenCalledWith(req, res);
    expect(findQuery(poolQueryLog, "FROM booking_settings")).toBeDefined();
    expect(findQuery(poolQueryLog, "FROM schedule_rules")).toBeDefined();
    expect(findQuery(poolQueryLog, "FROM schedule_overrides")).toBeDefined();
    expect(findQuery(poolQueryLog, "FROM blocked_slots")).toBeDefined();
  });

  it("updates booking settings and weekly rules in a transaction", async () => {
    const { clientQueryLog, client } = createMockDb({
      settings: [
        {
          min_advance_hours: 24,
          buffer_minutes: 30,
          allow_same_day_booking: false,
          max_days_ahead: 60,
          timezone: "Europe/Samara",
        },
      ],
      rules: [
        { weekday: 1, is_enabled: true, start_time: "09:00", end_time: "17:00" },
        { weekday: 2, is_enabled: true, start_time: "09:00", end_time: "17:00" },
        { weekday: 3, is_enabled: true, start_time: "09:00", end_time: "17:00" },
        { weekday: 4, is_enabled: true, start_time: "09:00", end_time: "17:00" },
        { weekday: 5, is_enabled: true, start_time: "09:00", end_time: "16:00" },
        { weekday: 6, is_enabled: false, start_time: "10:00", end_time: "10:00" },
        { weekday: 7, is_enabled: false, start_time: "10:00", end_time: "10:00" },
      ],
      overrides: [],
      blockedSlots: [],
    });
    const handler = await loadScheduleHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createSchedulePayload(),
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      settings: {
        minAdvanceHours: 24,
        bufferMinutes: 30,
        allowSameDayBooking: false,
        maxDaysAhead: 60,
        timezone: "Europe/Samara",
      },
    });
    expect(clientQueryLog[0]?.sql).toBe("BEGIN");
    expect(findQuery(clientQueryLog, "INSERT INTO booking_settings")?.values).toEqual([
      24,
      30,
      false,
      60,
      "Europe/Samara",
    ]);
    const ruleUpserts = findQueries(clientQueryLog, "INSERT INTO schedule_rules");
    expect(ruleUpserts).toHaveLength(7);
    expect(ruleUpserts[5]?.values).toEqual([6, false, "10:00", "10:00"]);
    expect(clientQueryLog.some((entry) => entry.sql === "COMMIT")).toBe(true);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid schedule payloads before opening a transaction", async () => {
    createMockDb();
    const handler = await loadScheduleHandler();

    const invalidTimezoneReq = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createSchedulePayload({
        settings: {
          minAdvanceHours: 24,
          bufferMinutes: 30,
          allowSameDayBooking: false,
          maxDaysAhead: 60,
          timezone: "Mars/Olympus",
        },
      }),
    });
    const invalidTimezoneRes = createMockResponse();
    await handler(invalidTimezoneReq, invalidTimezoneRes);

    const invalidRuleReq = createMockRequest({
      method: "POST",
      query: { action: "update" },
      body: createSchedulePayload({
        rules: [
          { weekday: 1, isEnabled: true, startTime: "18:00", endTime: "10:00" },
          { weekday: 2, isEnabled: true, startTime: "09:00", endTime: "17:00" },
          { weekday: 3, isEnabled: true, startTime: "09:00", endTime: "17:00" },
          { weekday: 4, isEnabled: true, startTime: "09:00", endTime: "17:00" },
          { weekday: 5, isEnabled: true, startTime: "09:00", endTime: "16:00" },
          { weekday: 6, isEnabled: false, startTime: "10:00", endTime: "10:00" },
          { weekday: 7, isEnabled: false, startTime: "10:00", endTime: "10:00" },
        ],
      }),
    });
    const invalidRuleRes = createMockResponse();
    await handler(invalidRuleReq, invalidRuleRes);

    expect(invalidTimezoneRes.statusCode).toBe(400);
    expect(invalidRuleRes.statusCode).toBe(400);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("creates working and non-working schedule overrides", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();

    const workingReq = createMockRequest({
      method: "POST",
      query: { action: "create-override" },
      body: {
        date: "2027-06-15",
        isWorkingDay: true,
        startTime: "12:00",
        endTime: "16:00",
        note: "Short day",
      },
    });
    const workingRes = createMockResponse();
    await handler(workingReq, workingRes);

    const nonWorkingReq = createMockRequest({
      method: "POST",
      query: { action: "create-override" },
      body: {
        date: "2027-06-16",
        isWorkingDay: false,
        startTime: "12:00",
        endTime: "16:00",
        note: "Vacation",
      },
    });
    const nonWorkingRes = createMockResponse();
    await handler(nonWorkingReq, nonWorkingRes);

    expect(workingRes.statusCode).toBe(200);
    expect(workingRes.jsonBody).toMatchObject({
      success: true,
      item: {
        date: "2027-06-15",
        isWorkingDay: true,
        startTime: "12:00",
        endTime: "16:00",
        note: "Short day",
      },
    });
    expect(nonWorkingRes.statusCode).toBe(200);
    expect(nonWorkingRes.jsonBody).toMatchObject({
      success: true,
      item: {
        date: "2027-06-16",
        isWorkingDay: false,
        startTime: null,
        endTime: null,
        note: "Vacation",
      },
    });
    const overrideInserts = findQueries(poolQueryLog, "INSERT INTO schedule_overrides");
    expect(overrideInserts[0]?.values).toEqual([
      "2027-06-15",
      true,
      "12:00",
      "16:00",
      "Short day",
    ]);
    expect(overrideInserts[1]?.values).toEqual([
      "2027-06-16",
      false,
      null,
      null,
      "Vacation",
    ]);
  });

  it("updates and deletes schedule overrides", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();

    const updateReq = createMockRequest({
      method: "POST",
      query: { action: "update-override" },
      body: {
        originalDate: "2027-06-15",
        date: "2027-06-17",
        isWorkingDay: true,
        startTime: "13:00",
        endTime: "17:00",
        note: "Moved",
      },
    });
    const updateRes = createMockResponse();
    await handler(updateReq, updateRes);

    const deleteReq = createMockRequest({
      method: "POST",
      query: { action: "delete-override" },
      body: {
        date: "2027-06-17",
      },
    });
    const deleteRes = createMockResponse();
    await handler(deleteReq, deleteRes);

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.jsonBody).toMatchObject({
      success: true,
      item: {
        date: "2027-06-17",
        startTime: "13:00",
        endTime: "17:00",
        note: "Moved",
      },
    });
    expect(findQuery(poolQueryLog, "UPDATE schedule_overrides")?.values).toEqual([
      "2027-06-15",
      "2027-06-17",
      true,
      "13:00",
      "17:00",
      "Moved",
    ]);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.jsonBody).toEqual({
      success: true,
      date: "2027-06-17",
    });
    expect(findQuery(poolQueryLog, "DELETE FROM schedule_overrides")?.values).toEqual([
      "2027-06-17",
    ]);
  });

  it("rejects invalid override payloads", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create-override" },
      body: {
        date: "2027-06-15",
        isWorkingDay: true,
        startTime: "17:00",
        endTime: "13:00",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(findQuery(poolQueryLog, "INSERT INTO schedule_overrides")).toBeUndefined();
  });

  it("rejects schedule override with too long note", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create-override" },
      body: {
        date: "2027-06-15",
        isWorkingDay: true,
        startTime: "12:00",
        endTime: "16:00",
        note: "а".repeat(201),
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({
      error: expect.stringContaining("200"),
    });
    expect(findQuery(poolQueryLog, "INSERT INTO schedule_overrides")).toBeUndefined();
  });

  it("creates, updates and deletes blocked slots", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();

    const createReq = createMockRequest({
      method: "POST",
      query: { action: "create-blocked-slot" },
      body: {
        blockedDate: "2027-06-20",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Lunch",
      },
    });
    const createRes = createMockResponse();
    await handler(createReq, createRes);

    const updateReq = createMockRequest({
      method: "POST",
      query: { action: "update-blocked-slot" },
      body: {
        id: 31,
        blockedDate: "2027-06-21",
        startTime: "14:00",
        endTime: "15:30",
        reason: "Admin",
      },
    });
    const updateRes = createMockResponse();
    await handler(updateReq, updateRes);

    const deleteReq = createMockRequest({
      method: "POST",
      query: { action: "delete-blocked-slot" },
      body: { id: 31 },
    });
    const deleteRes = createMockResponse();
    await handler(deleteReq, deleteRes);

    expect(createRes.statusCode).toBe(200);
    expect(createRes.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 31,
        blockedDate: "2027-06-20",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Lunch",
      },
    });
    expect(findQuery(poolQueryLog, "INSERT INTO blocked_slots")?.values).toEqual([
      "2027-06-20",
      "12:00",
      "13:00",
      "Lunch",
    ]);
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 31,
        blockedDate: "2027-06-21",
        startTime: "14:00",
        endTime: "15:30",
        reason: "Admin",
      },
    });
    expect(findQuery(poolQueryLog, "UPDATE blocked_slots")?.values).toEqual([
      31,
      "2027-06-21",
      "14:00",
      "15:30",
      "Admin",
    ]);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.jsonBody).toEqual({
      success: true,
      id: 31,
    });
    expect(findQuery(poolQueryLog, "DELETE FROM blocked_slots")?.values).toEqual([
      31,
    ]);
  });

  it("rejects invalid or overlapping blocked slots", async () => {
    const invalidDb = createMockDb();
    const handler = await loadScheduleHandler();

    const invalidReq = createMockRequest({
      method: "POST",
      query: { action: "create-blocked-slot" },
      body: {
        blockedDate: "2027-06-20",
        startTime: "15:00",
        endTime: "13:00",
      },
    });
    const invalidRes = createMockResponse();
    await handler(invalidReq, invalidRes);

    expect(invalidRes.statusCode).toBe(400);
    expect(findQuery(invalidDb.poolQueryLog, "INSERT INTO blocked_slots")).toBeUndefined();

    const overlapDb = createMockDb({ blockedOverlap: true });
    const overlapReq = createMockRequest({
      method: "POST",
      query: { action: "create-blocked-slot" },
      body: {
        blockedDate: "2027-06-20",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Lunch",
      },
    });
    const overlapRes = createMockResponse();
    await handler(overlapReq, overlapRes);

    expect(overlapRes.statusCode).toBe(400);
    expect(findQuery(overlapDb.poolQueryLog, "FROM blocked_slots")?.values).toEqual([
      "2027-06-20",
      "12:00",
      "13:00",
    ]);
    expect(findQuery(overlapDb.poolQueryLog, "INSERT INTO blocked_slots")).toBeUndefined();
  });

  it("rejects blocked slot with too long reason", async () => {
    const { poolQueryLog } = createMockDb();
    const handler = await loadScheduleHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "create-blocked-slot" },
      body: {
        blockedDate: "2027-06-20",
        startTime: "12:00",
        endTime: "13:00",
        reason: "а".repeat(201),
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({
      error: expect.stringContaining("200"),
    });
    expect(findQuery(poolQueryLog, "INSERT INTO blocked_slots")).toBeUndefined();
  });

  it("handles unsupported methods and unknown actions", async () => {
    createMockDb();
    const handler = await loadScheduleHandler();

    const methodReq = createMockRequest({
      method: "PUT",
    });
    const methodRes = createMockResponse();
    await handler(methodReq, methodRes);

    const actionReq = createMockRequest({
      method: "POST",
      query: { action: "unknown" },
    });
    const actionRes = createMockResponse();
    await handler(actionReq, actionRes);

    expect(methodRes.statusCode).toBe(405);
    expect(methodRes.jsonBody).toEqual({ error: "Method not allowed" });
    expect(actionRes.statusCode).toBe(405);
    expect(actionRes.jsonBody).toEqual({ error: "Method not allowed" });
  });
});