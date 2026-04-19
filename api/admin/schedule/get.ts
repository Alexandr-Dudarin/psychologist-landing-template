/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import { requireAdminRequest } from "../../../server/auth/requireAdmin";
import type {
  AdminScheduleRecord,
  BlockedSlotRecord,
  BookingSettingsRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
} from "../../../src/types/schedule";

type SettingsRow = {
  min_advance_hours: number | string;
  buffer_minutes: number | string;
  allow_same_day_booking: boolean;
  max_days_ahead: number | string;
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
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
};

function mapSettings(row: SettingsRow): BookingSettingsRecord {
  return {
    minAdvanceHours: Number(row.min_advance_hours),
    bufferMinutes: Number(row.buffer_minutes),
    allowSameDayBooking: row.allow_same_day_booking,
    maxDaysAhead: Number(row.max_days_ahead),
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
    blockedDate: row.blocked_date,
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

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
        max_days_ahead
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
