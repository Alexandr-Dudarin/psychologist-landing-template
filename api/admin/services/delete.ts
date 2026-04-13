/// <reference types="node" />

import { pool } from "../../../server/db/pool";

type ParsedPayload = {
  id: number;
};

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

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { id };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректный id услуги" });
  }

  try {
    const result = await pool.query<{ id: number }>(
      `
        DELETE FROM services
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Услуга не найдена" });
    }

    return res.status(200).json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Service delete error:", error);
    return res.status(500).json({ error: "Не удалось удалить услугу" });
  }
}