/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmNoteRecord } from "../../../src/types/note";

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

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIdRaw = getSingleQueryValue(req.query?.clientId).trim();
  const sessionIdRaw = getSingleQueryValue(req.query?.sessionId).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (clientIdRaw && clientIdRaw !== "all") {
    const clientId = Number(clientIdRaw);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({ error: "Некорректный клиент" });
    }

    values.push(clientId);
    conditions.push(`n.client_id = $${values.length}`);
  }

  if (sessionIdRaw && sessionIdRaw !== "all") {
    const sessionId = Number(sessionIdRaw);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: "Некорректная сессия" });
    }

    values.push(sessionId);
    conditions.push(`n.session_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchIndex = values.length;

    conditions.push(`
      (
        CAST(n.id AS TEXT) ILIKE $${searchIndex}
        OR c.name ILIKE $${searchIndex}
        OR COALESCE(sv.title, '') ILIKE $${searchIndex}
        OR n.content ILIKE $${searchIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query<NoteRow>(
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
        ${whereClause}
        ORDER BY n.created_at DESC
      `,
      values
    );

    const items: CrmNoteRecord[] = result.rows.map((row) => ({
      id: Number(row.id),
      clientId: Number(row.client_id),
      clientName: row.client_name,
      sessionId: row.session_id === null ? null : Number(row.session_id),
      sessionScheduledAt: row.session_scheduled_at,
      sessionServiceTitle: row.session_service_title,
      content: row.content,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Notes list error:", error);
    return res.status(500).json({ error: "Не удалось загрузить заметки" });
  }
}