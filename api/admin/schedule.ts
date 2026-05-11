/// <reference types="node" />

import { requireAdminRequest } from "../../server/auth/requireAdmin.js";
import { pool } from "../../server/db/pool.js";
import {
  isBookingTimezone,
  resolveBookingTimezone,
} from "../../src/lib/booking/bookingTimezones.js";
import type {
  AdminScheduleRecord,
  BlockedSlotRecord,
  BookingSettingsRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
} from "../../src/types/schedule.js";

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
  id: string | number;
  blocked_date: string | Date;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
};

type ParsedSchedulePayload = {
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
};

type ParsedCreateOverridePayload = {
  date: string;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string;
};

type ParsedUpdateOverridePayload = ParsedCreateOverridePayload & {
  originalDate: string;
};

type ParsedDeleteOverridePayload = {
  date: string;
};

type ParsedCreateBlockedSlotPayload = {
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type ParsedUpdateBlockedSlotPayload = ParsedCreateBlockedSlotPayload & {
  id: number;
};

type ParsedDeleteBlockedSlotPayload = {
  id: number;
};

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeDateOnly(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isPastOverrideDate(date: string): boolean {
  return date < getTodayLocalDateString();
}

function isPastBlockedSlotStart(blockedDate: string, startTime: string): boolean {
  const timestamp = new Date(`${blockedDate}T${startTime}`).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < Date.now();
}

function mapSettings(row: SettingsRow): BookingSettingsRecord {
  return {
    minAdvanceHours: Number(row.min_advance_hours),
    bufferMinutes: Number(row.buffer_minutes),
    allowSameDayBooking: row.allow_same_day_booking,
    maxDaysAhead: Number(row.max_days_ahead),
    timezone: resolveBookingTimezone(row.timezone),
  };
}

function mapRule(row: RuleRow): ScheduleRuleRecord {
  return {
    weekday: Number(row.weekday),
    isEnabled: row.is_enabled,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

function mapOverride(row: OverrideRow): ScheduleOverrideRecord {
  return {
    date: row.override_date,
    isWorkingDay: row.is_working_day,
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    endTime: row.end_time ? row.end_time.slice(0, 5) : null,
    note: row.note,
  };
}

function mapBlockedSlot(row: BlockedSlotRow): BlockedSlotRecord {
  return {
    id: Number(row.id),
    blockedDate: normalizeDateOnly(row.blocked_date),
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    reason: row.reason,
    createdAt: row.created_at,
  };
}

async function ensureDefaults() {
  await pool.query(`
    INSERT INTO booking_settings (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO schedule_rules (weekday, is_enabled, start_time, end_time)
    VALUES
      (1, TRUE,  '10:00', '19:00'),
      (2, TRUE,  '10:00', '19:00'),
      (3, TRUE,  '10:00', '19:00'),
      (4, TRUE,  '10:00', '19:00'),
      (5, TRUE,  '10:00', '19:00'),
      (6, FALSE, '10:00', '19:00'),
      (7, FALSE, '10:00', '19:00')
    ON CONFLICT (weekday) DO NOTHING
  `);
}

function parseScheduleBody(body: any): ParsedSchedulePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const settings = rawBody?.settings;
  const rules = rawBody?.rules;

  if (!settings || !Array.isArray(rules)) {
    return null;
  }

  const parsedSettings: BookingSettingsRecord = {
    minAdvanceHours: Number(settings.minAdvanceHours),
    bufferMinutes: Number(settings.bufferMinutes),
    allowSameDayBooking: Boolean(settings.allowSameDayBooking),
    maxDaysAhead: Number(settings.maxDaysAhead),
    timezone:
      typeof settings.timezone === "string" ? settings.timezone.trim() : "",
  };

  if (
    !Number.isInteger(parsedSettings.minAdvanceHours) ||
    parsedSettings.minAdvanceHours < 0
  ) {
    return null;
  }

  if (
    !Number.isInteger(parsedSettings.bufferMinutes) ||
    parsedSettings.bufferMinutes < 0
  ) {
    return null;
  }

  if (
    !Number.isInteger(parsedSettings.maxDaysAhead) ||
    parsedSettings.maxDaysAhead <= 0
  ) {
    return null;
  }

  if (!isBookingTimezone(parsedSettings.timezone)) {
    return null;
  }

  const parsedRules: ScheduleRuleRecord[] = rules.map((rule: any) => ({
    weekday: Number(rule.weekday),
    isEnabled: Boolean(rule.isEnabled),
    startTime: typeof rule.startTime === "string" ? rule.startTime : "",
    endTime: typeof rule.endTime === "string" ? rule.endTime : "",
  }));

  if (parsedRules.length !== 7) {
    return null;
  }

  const weekdays = new Set(parsedRules.map((rule) => rule.weekday));

  if (weekdays.size !== 7) {
    return null;
  }

  for (const rule of parsedRules) {
    if (!Number.isInteger(rule.weekday) || rule.weekday < 1 || rule.weekday > 7) {
      return null;
    }

    if (!isValidTime(rule.startTime) || !isValidTime(rule.endTime)) {
      return null;
    }

    if (rule.isEnabled && rule.startTime >= rule.endTime) {
      return null;
    }
  }

  return {
    settings: parsedSettings,
    rules: parsedRules.sort((a, b) => a.weekday - b.weekday),
  };
}

function parseCreateOverrideBody(
  body: any
): ParsedCreateOverridePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const rawDate = typeof rawBody?.date === "string" ? rawBody.date.trim() : "";
  const date = rawDate.slice(0, 10);
  const isWorkingDay = Boolean(rawBody?.isWorkingDay);
  const startTime =
    typeof rawBody?.startTime === "string" && rawBody.startTime.trim()
      ? rawBody.startTime.trim()
      : null;
  const endTime =
    typeof rawBody?.endTime === "string" && rawBody.endTime.trim()
      ? rawBody.endTime.trim()
      : null;
  const note = typeof rawBody?.note === "string" ? rawBody.note.trim() : "";

  if (!isValidDate(date)) {
    return null;
  }

  if (isWorkingDay) {
    if (!startTime || !endTime) {
      return null;
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      startTime >= endTime
    ) {
      return null;
    }
  }

  return {
    date,
    isWorkingDay,
    startTime: isWorkingDay ? startTime : null,
    endTime: isWorkingDay ? endTime : null,
    note,
  };
}

function parseUpdateOverrideBody(
  body: any
): ParsedUpdateOverridePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const rawOriginalDate =
    typeof rawBody?.originalDate === "string" ? rawBody.originalDate.trim() : "";
  const rawDate = typeof rawBody?.date === "string" ? rawBody.date.trim() : "";

  const originalDate = rawOriginalDate.slice(0, 10);
  const date = rawDate.slice(0, 10);
  const isWorkingDay = Boolean(rawBody?.isWorkingDay);
  const startTime =
    typeof rawBody?.startTime === "string" && rawBody.startTime.trim()
      ? rawBody.startTime.trim()
      : null;
  const endTime =
    typeof rawBody?.endTime === "string" && rawBody.endTime.trim()
      ? rawBody.endTime.trim()
      : null;
  const note = typeof rawBody?.note === "string" ? rawBody.note.trim() : "";

  if (!isValidDate(originalDate) || !isValidDate(date)) {
    return null;
  }

  if (isWorkingDay) {
    if (!startTime || !endTime) {
      return null;
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      startTime >= endTime
    ) {
      return null;
    }
  }

  return {
    originalDate,
    date,
    isWorkingDay,
    startTime: isWorkingDay ? startTime : null,
    endTime: isWorkingDay ? endTime : null,
    note,
  };
}

function parseDeleteOverrideBody(
  body: any
): ParsedDeleteOverridePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const rawDate = typeof rawBody?.date === "string" ? rawBody.date.trim() : "";
  const date = rawDate.slice(0, 10);

  if (!isValidDate(date)) {
    return null;
  }

  return { date };
}

function parseCreateBlockedSlotBody(
  body: any
): ParsedCreateBlockedSlotPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const rawBlockedDate =
    typeof rawBody?.blockedDate === "string" ? rawBody.blockedDate.trim() : "";
  const blockedDate = rawBlockedDate.slice(0, 10);
  const startTime =
    typeof rawBody?.startTime === "string" ? rawBody.startTime.trim() : "";
  const endTime =
    typeof rawBody?.endTime === "string" ? rawBody.endTime.trim() : "";
  const reason =
    typeof rawBody?.reason === "string" ? rawBody.reason.trim() : "";

  if (!isValidDate(blockedDate)) {
    return null;
  }

  if (
    !isValidTime(startTime) ||
    !isValidTime(endTime) ||
    startTime >= endTime
  ) {
    return null;
  }

  return {
    blockedDate,
    startTime,
    endTime,
    reason,
  };
}

function parseUpdateBlockedSlotBody(
  body: any
): ParsedUpdateBlockedSlotPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);
  const rawBlockedDate =
    typeof rawBody?.blockedDate === "string" ? rawBody.blockedDate.trim() : "";
  const blockedDate = rawBlockedDate.slice(0, 10);
  const startTime =
    typeof rawBody?.startTime === "string" ? rawBody.startTime.trim() : "";
  const endTime =
    typeof rawBody?.endTime === "string" ? rawBody.endTime.trim() : "";
  const reason =
    typeof rawBody?.reason === "string" ? rawBody.reason.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!isValidDate(blockedDate)) {
    return null;
  }

  if (
    !isValidTime(startTime) ||
    !isValidTime(endTime) ||
    startTime >= endTime
  ) {
    return null;
  }

  return {
    id,
    blockedDate,
    startTime,
    endTime,
    reason,
  };
}

function parseDeleteBlockedSlotBody(
  body: any
): ParsedDeleteBlockedSlotPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { id };
}

async function handleGet(req: any, res: any) {
  if (!requireAdminRequest(req, res)) {
    return;
  }

  try {
    await ensureDefaults();

    const settingsResult = await pool.query<SettingsRow>(`
      SELECT
        min_advance_hours,
        buffer_minutes,
        allow_same_day_booking,
        max_days_ahead,
        timezone
      FROM booking_settings
      WHERE id = 1
      LIMIT 1
    `);

    const rulesResult = await pool.query<RuleRow>(`
      SELECT
        weekday,
        is_enabled,
        start_time,
        end_time
      FROM schedule_rules
      ORDER BY weekday ASC
    `);

    const overridesResult = await pool.query<OverrideRow>(`
      SELECT
        override_date::text AS override_date,
        is_working_day,
        start_time,
        end_time,
        note
      FROM schedule_overrides
      ORDER BY override_date ASC
    `);

    const blockedSlotsResult = await pool.query<BlockedSlotRow>(`
      SELECT
        id,
        blocked_date::text AS blocked_date,
        start_time,
        end_time,
        reason,
        created_at
      FROM blocked_slots
      ORDER BY blocked_date ASC, start_time ASC
    `);

    const settingsRow = settingsResult.rows[0];

    if (!settingsRow) {
      return res
        .status(500)
        .json({ error: "Не удалось загрузить настройки записи" });
    }

    const payload: AdminScheduleRecord = {
      settings: mapSettings(settingsRow),
      rules: rulesResult.rows.map(mapRule),
      overrides: overridesResult.rows.map(mapOverride),
      blockedSlots: blockedSlotsResult.rows.map(mapBlockedSlot),
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Admin schedule get error:", error);
    return res.status(500).json({ error: "Не удалось загрузить расписание" });
  }
}

async function handleUpdate(req: any, res: any) {
  const payload = parseScheduleBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для сохранения расписания.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO booking_settings (
          id,
          min_advance_hours,
          buffer_minutes,
          allow_same_day_booking,
          max_days_ahead,
          timezone,
          updated_at
        )
        VALUES (1, $1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          min_advance_hours = EXCLUDED.min_advance_hours,
          buffer_minutes = EXCLUDED.buffer_minutes,
          allow_same_day_booking = EXCLUDED.allow_same_day_booking,
          max_days_ahead = EXCLUDED.max_days_ahead,
          timezone = EXCLUDED.timezone,
          updated_at = NOW()
      `,
      [
        payload.settings.minAdvanceHours,
        payload.settings.bufferMinutes,
        payload.settings.allowSameDayBooking,
        payload.settings.maxDaysAhead,
        payload.settings.timezone,
      ]
    );

    for (const rule of payload.rules) {
      await client.query(
        `
          INSERT INTO schedule_rules (
            weekday,
            is_enabled,
            start_time,
            end_time
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (weekday)
          DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time
        `,
        [rule.weekday, rule.isEnabled, rule.startTime, rule.endTime]
      );
    }

    const settingsResult = await client.query<SettingsRow>(`
      SELECT
        min_advance_hours,
        buffer_minutes,
        allow_same_day_booking,
        max_days_ahead,
        timezone
      FROM booking_settings
      WHERE id = 1
      LIMIT 1
    `);

    const rulesResult = await client.query<RuleRow>(`
      SELECT
        weekday,
        is_enabled,
        start_time,
        end_time
      FROM schedule_rules
      ORDER BY weekday ASC
    `);

    const overridesResult = await client.query<OverrideRow>(`
      SELECT
        override_date::text AS override_date,
        is_working_day,
        start_time,
        end_time,
        note
      FROM schedule_overrides
      ORDER BY override_date ASC
    `);

    const blockedSlotsResult = await client.query<BlockedSlotRow>(`
      SELECT
        id,
        blocked_date::text AS blocked_date,
        start_time,
        end_time,
        reason,
        created_at
      FROM blocked_slots
      ORDER BY blocked_date ASC, start_time ASC
    `);

    await client.query("COMMIT");

    const responsePayload: AdminScheduleRecord = {
      settings: mapSettings(settingsResult.rows[0]),
      rules: rulesResult.rows.map(mapRule),
      overrides: overridesResult.rows.map(mapOverride),
      blockedSlots: blockedSlotsResult.rows.map(mapBlockedSlot),
    };

    return res.status(200).json({
      success: true,
      ...responsePayload,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin schedule update error:", error);
    return res.status(500).json({ error: "Не удалось сохранить расписание" });
  } finally {
    client.release();
  }
}

async function handleCreateOverride(req: any, res: any) {
  const payload = parseCreateOverrideBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для исключения по дате.",
    });
  }

  if (isPastOverrideDate(payload.date)) {
    return res.status(400).json({
      error: "Нельзя создать исключение для прошедшей даты.",
    });
  }

  try {
    const result = await pool.query<OverrideRow>(
      `
        INSERT INTO schedule_overrides (
          override_date,
          is_working_day,
          start_time,
          end_time,
          note,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (override_date)
        DO UPDATE SET
          is_working_day = EXCLUDED.is_working_day,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          note = EXCLUDED.note,
          updated_at = NOW()
        RETURNING
          override_date::text AS override_date,
          is_working_day,
          start_time,
          end_time,
          note
      `,
      [
        payload.date,
        payload.isWorkingDay,
        payload.startTime,
        payload.endTime,
        payload.note,
      ]
    );

    return res.status(200).json({
      success: true,
      item: mapOverride(result.rows[0]),
    });
  } catch (error) {
    console.error("Schedule override create error:", error);
    return res.status(500).json({
      error: "Не удалось сохранить исключение по дате",
    });
  }
}

async function handleUpdateOverride(req: any, res: any) {
  const payload = parseUpdateOverrideBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления исключения по дате.",
    });
  }

  if (isPastOverrideDate(payload.date)) {
    return res.status(400).json({
      error: "Нельзя перенести исключение на прошедшую дату.",
    });
  }

  try {
    const result = await pool.query<OverrideRow>(
      `
        UPDATE schedule_overrides
        SET
          override_date = $2,
          is_working_day = $3,
          start_time = $4,
          end_time = $5,
          note = $6,
          updated_at = NOW()
        WHERE override_date = $1
        RETURNING
          override_date::text AS override_date,
          is_working_day,
          start_time,
          end_time,
          note
      `,
      [
        payload.originalDate,
        payload.date,
        payload.isWorkingDay,
        payload.startTime,
        payload.endTime,
        payload.note,
      ]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({
        error: "Исключение по дате не найдено.",
      });
    }

    return res.status(200).json({
      success: true,
      item: mapOverride(updated),
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(400).json({
        error: "На эту дату уже есть другое исключение.",
      });
    }

    console.error("Schedule override update error:", error);
    return res.status(500).json({
      error: "Не удалось обновить исключение по дате",
    });
  }
}

async function handleDeleteOverride(req: any, res: any) {
  const payload = parseDeleteOverrideBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректная дата исключения" });
  }

  try {
    const result = await pool.query<{ override_date: string }>(
      `
        DELETE FROM schedule_overrides
        WHERE override_date = $1
        RETURNING override_date::text AS override_date
      `,
      [payload.date]
    );

    const deleted = result.rows[0];

    if (!deleted) {
      return res.status(404).json({ error: "Исключение по дате не найдено" });
    }

    return res.status(200).json({
      success: true,
      date: deleted.override_date,
    });
  } catch (error) {
    console.error("Schedule override delete error:", error);
    return res.status(500).json({ error: "Не удалось удалить исключение по дате" });
  }
}

async function handleCreateBlockedSlot(req: any, res: any) {
  const payload = parseCreateBlockedSlotBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для блокировки слота.",
    });
  }

  if (isPastBlockedSlotStart(payload.blockedDate, payload.startTime)) {
    return res.status(400).json({
      error: "Нельзя создать блокировку в прошлом.",
    });
  }

  try {
    const overlapResult = await pool.query<{ id: string | number }>(
      `
        SELECT id
        FROM blocked_slots
        WHERE blocked_date = $1
          AND NOT (end_time <= $2 OR start_time >= $3)
        LIMIT 1
      `,
      [payload.blockedDate, payload.startTime, payload.endTime]
    );

    if (overlapResult.rows[0]) {
      return res.status(400).json({
        error: "На это время уже есть блокировка.",
      });
    }

    const result = await pool.query<BlockedSlotRow>(
      `
        INSERT INTO blocked_slots (
          blocked_date,
          start_time,
          end_time,
          reason
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          blocked_date,
          start_time,
          end_time,
          reason,
          created_at
      `,
      [
        payload.blockedDate,
        payload.startTime,
        payload.endTime,
        payload.reason,
      ]
    );

    return res.status(200).json({
      success: true,
      item: mapBlockedSlot(result.rows[0]),
    });
  } catch (error) {
    console.error("Blocked slot create error:", error);
    return res.status(500).json({
      error: "Не удалось создать блокировку слота",
    });
  }
}

async function handleUpdateBlockedSlot(req: any, res: any) {
  const payload = parseUpdateBlockedSlotBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления блокировки слота.",
    });
  }

  if (isPastBlockedSlotStart(payload.blockedDate, payload.startTime)) {
    return res.status(400).json({
      error: "Нельзя перенести блокировку в прошлое.",
    });
  }

  try {
    const overlapResult = await pool.query<{ id: string | number }>(
      `
        SELECT id
        FROM blocked_slots
        WHERE blocked_date = $1
          AND id <> $4
          AND NOT (end_time <= $2 OR start_time >= $3)
        LIMIT 1
      `,
      [payload.blockedDate, payload.startTime, payload.endTime, payload.id]
    );

    if (overlapResult.rows[0]) {
      return res.status(400).json({
        error: "На это время уже есть другая блокировка.",
      });
    }

    const result = await pool.query<BlockedSlotRow>(
      `
        UPDATE blocked_slots
        SET
          blocked_date = $2,
          start_time = $3,
          end_time = $4,
          reason = $5
        WHERE id = $1
        RETURNING
          id,
          blocked_date::text AS blocked_date,
          start_time,
          end_time,
          reason,
          created_at
      `,
      [
        payload.id,
        payload.blockedDate,
        payload.startTime,
        payload.endTime,
        payload.reason,
      ]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({
        error: "Блокировка слота не найдена.",
      });
    }

    return res.status(200).json({
      success: true,
      item: mapBlockedSlot(updated),
    });
  } catch (error) {
    console.error("Blocked slot update error:", error);
    return res.status(500).json({
      error: "Не удалось обновить блокировку слота",
    });
  }
}

async function handleDeleteBlockedSlot(req: any, res: any) {
  const payload = parseDeleteBlockedSlotBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для удаления блокировки слота.",
    });
  }

  try {
    const result = await pool.query<{ id: string | number }>(
      `
        DELETE FROM blocked_slots
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    const deleted = result.rows[0];

    if (!deleted) {
      return res.status(404).json({
        error: "Блокировка слота не найдена.",
      });
    }

    return res.status(200).json({
      success: true,
      id: Number(deleted.id),
    });
  } catch (error) {
    console.error("Blocked slot delete error:", error);
    return res.status(500).json({
      error: "Не удалось удалить блокировку слота",
    });
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = getSingleQueryValue(req.query?.action).trim();

  if (action === "create-blocked-slot") {
    return handleCreateBlockedSlot(req, res);
  }

  if (action === "create-override") {
    return handleCreateOverride(req, res);
  }

  if (action === "delete-blocked-slot") {
    return handleDeleteBlockedSlot(req, res);
  }

  if (action === "delete-override") {
    return handleDeleteOverride(req, res);
  }

  if (action === "update-blocked-slot") {
    return handleUpdateBlockedSlot(req, res);
  }

  if (action === "update-override") {
    return handleUpdateOverride(req, res);
  }

  if (action === "update") {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
