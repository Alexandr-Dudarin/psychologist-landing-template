/// <reference types="node" />

import { pool } from "../../../server/db/pool.js";

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
    return res.status(400).json({ error: "Некорректный id заметки" });
  }

  try {
    const result = await pool.query<{ id: string | number }>(
      `
        DELETE FROM notes
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    const deleted = result.rows[0];

    if (!deleted) {
      return res.status(404).json({ error: "Заметка не найдена" });
    }

    return res.status(200).json({
      success: true,
      id: Number(deleted.id),
    });
  } catch (error) {
    console.error("Note delete error:", error);
    return res.status(500).json({ error: "Не удалось удалить заметку" });
  }
}