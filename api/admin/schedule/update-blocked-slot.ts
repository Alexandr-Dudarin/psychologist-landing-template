/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { BlockedSlotRecord } from "../../../src/types/schedule";

type ParsedPayload = {
  id: number;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type BlockedSlotRow = {
  id: string | number;
  blocked_date: string | Date;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
};

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

function parseBody(body: any): ParsedPayload | null {
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
  const reason = typeof rawBody?.reason === "string" ? rawBody.reason.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!isValidDate(blockedDate)) {
    return null;
  }

  if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления блокировки слота.",
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