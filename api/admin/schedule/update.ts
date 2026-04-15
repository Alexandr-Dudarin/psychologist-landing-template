/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  AdminScheduleRecord,
  BookingSettingsRecord,
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

type ParsedPayload = {
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
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

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function parseBody(body: any): ParsedPayload | null {
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

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
          updated_at
        )
        VALUES (1, $1, $2, $3, $4, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          min_advance_hours = EXCLUDED.min_advance_hours,
          buffer_minutes = EXCLUDED.buffer_minutes,
          allow_same_day_booking = EXCLUDED.allow_same_day_booking,
          max_days_ahead = EXCLUDED.max_days_ahead,
          updated_at = NOW()
      `,
      [
        payload.settings.minAdvanceHours,
        payload.settings.bufferMinutes,
        payload.settings.allowSameDayBooking,
        payload.settings.maxDaysAhead,
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
        max_days_ahead
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

    await client.query("COMMIT");

    const responsePayload: AdminScheduleRecord = {
      settings: mapSettings(settingsResult.rows[0]),
      rules: rulesResult.rows.map(mapRule),
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