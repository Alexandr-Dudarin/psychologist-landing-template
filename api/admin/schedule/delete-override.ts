/// <reference types="node" />

import { pool } from "../../../server/db/pool";

type ParsedPayload = {
  date: string;
};

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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

  if (!isValidDate(date)) {
    return null;
  }

  return { date };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

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