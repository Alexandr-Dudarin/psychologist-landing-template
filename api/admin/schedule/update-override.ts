/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { ScheduleOverrideRecord } from "../../../src/types/schedule";

type ParsedPayload = {
  originalDate: string;
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

    if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления исключения по дате.",
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