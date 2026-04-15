/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmNoteRecord } from "../../../src/types/note";

type ParsedPayload = {
  id: number;
  clientId: number;
  sessionId: number | null;
  content: string;
};

type NoteRow = {
  id: string | number;
  client_id: string | number;
  client_name: string;
  session_id: string | number | null;
  session_scheduled_at: string | null;
  session_service_title: string | null;
  content: string;
  created_at: string;
};

function mapNote(row: NoteRow): CrmNoteRecord {
  return {
    id: Number(row.id),
    clientId: Number(row.client_id),
    clientName: row.client_name,
    sessionId: row.session_id === null ? null : Number(row.session_id),
    sessionScheduledAt: row.session_scheduled_at,
    sessionServiceTitle: row.session_service_title,
    content: row.content,
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
  const clientId = Number(rawBody?.clientId);
  const sessionId =
    rawBody?.sessionId === null ||
    rawBody?.sessionId === undefined ||
    rawBody?.sessionId === ""
      ? null
      : Number(rawBody.sessionId);
  const content =
    typeof rawBody?.content === "string" ? rawBody.content.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null;
  }

  if (sessionId !== null && (!Number.isInteger(sessionId) || sessionId <= 0)) {
    return null;
  }

  if (!content) {
    return null;
  }

  return {
    id,
    clientId,
    sessionId,
    content,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления заметки.",
    });
  }

  try {
    const updatedResult = await pool.query<{ id: string | number }>(
      `
        UPDATE notes
        SET
          client_id = $1,
          session_id = $2,
          content = $3
        WHERE id = $4
        RETURNING id
      `,
      [payload.clientId, payload.sessionId, payload.content, payload.id]
    );

    const updated = updatedResult.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Заметка не найдена" });
    }

    const joined = await pool.query<NoteRow>(
      `
        SELECT
          n.id,
          n.client_id,
          c.name AS client_name,
          n.session_id,
          s.scheduled_at AS session_scheduled_at,
          sv.title AS session_service_title,
          n.content,
          n.created_at
        FROM notes n
        INNER JOIN clients c ON c.id = n.client_id
        LEFT JOIN sessions s ON s.id = n.session_id
        LEFT JOIN services sv ON sv.id = s.service_id
        WHERE n.id = $1
        LIMIT 1
      `,
      [updated.id]
    );

    return res.status(200).json({
      success: true,
      item: mapNote(joined.rows[0]),
    });
  } catch (error) {
    console.error("Note update error:", error);
    return res.status(500).json({ error: "Не удалось обновить заметку" });
  }
}