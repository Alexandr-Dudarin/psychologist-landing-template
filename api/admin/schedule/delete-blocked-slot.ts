/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { BlockedSlotRecord } from "../../../src/types/schedule";

type ParsedPayload = {
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type BlockedSlotRow = {
  id: string | number;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
};

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
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

function parseBody(body: any): ParsedPayload | null {
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
  const reason = typeof rawBody?.reason === "string" ? rawBody.reason.trim() : "";

  if (!isValidDate(blockedDate)) {
    return null;
  }

  if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
    return null;
  }

  return {
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
      error: "Некорректные данные для блокировки слота.",
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
          blocked_date::text AS blocked_date,
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
    return res.status(500).json({ error: "Не удалось создать блокировку слота" });
  }
}