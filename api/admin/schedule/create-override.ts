/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { ScheduleOverrideRecord } from "../../../src/types/schedule";

type ParsedPayload = {
  date: string;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string;
};

type OverrideRow = {
  override_date: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string;
};

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
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

function parseBody(body: any): ParsedPayload | null {
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

    if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для исключения по дате.",
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
    return res.status(500).json({ error: "Не удалось сохранить исключение по дате" });
  }
}