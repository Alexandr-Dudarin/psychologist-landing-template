/// <reference types="node" />

import { requireAdminRequest } from "../../server/auth/requireAdmin.js";
import { pool } from "../../server/db/pool.js";
import type { CrmNoteRecord } from "../../src/types/note.js";

type ParsedCreatePayload = {
  clientId: number;
  sessionId: number | null;
  content: string;
};

type ParsedUpdatePayload = ParsedCreatePayload & {
  id: number;
};

type ParsedDeletePayload = {
  id: number;
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

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

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

function parseCreateBody(body: any): ParsedCreatePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const clientId = Number(rawBody?.clientId);
  const sessionId =
    rawBody?.sessionId === null || rawBody?.sessionId === undefined || rawBody?.sessionId === ""
      ? null
      : Number(rawBody.sessionId);
  const content =
    typeof rawBody?.content === "string" ? rawBody.content.trim() : "";

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
    clientId,
    sessionId,
    content,
  };
}

function parseUpdateBody(body: any): ParsedUpdatePayload | null {
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

function parseDeleteBody(body: any): ParsedDeletePayload | null {
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

async function selectNote(id: string | number) {
  return pool.query<NoteRow>(
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
    [id]
  );
}

async function handleList(req: any, res: any) {
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

async function handleCreate(req: any, res: any) {
  const payload = parseCreateBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для создания заметки.",
    });
  }

  try {
    const insertResult = await pool.query<{ id: string | number }>(
      `
        INSERT INTO notes (
          client_id,
          session_id,
          content
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [payload.clientId, payload.sessionId, payload.content]
    );

    const created = insertResult.rows[0];
    const joined = await selectNote(created.id);

    return res.status(200).json({
      success: true,
      item: mapNote(joined.rows[0]),
    });
  } catch (error) {
    console.error("Note create error:", error);
    return res.status(500).json({ error: "Не удалось создать заметку" });
  }
}

async function handleUpdate(req: any, res: any) {
  const payload = parseUpdateBody(req.body);

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

    const joined = await selectNote(updated.id);

    return res.status(200).json({
      success: true,
      item: mapNote(joined.rows[0]),
    });
  } catch (error) {
    console.error("Note update error:", error);
    return res.status(500).json({ error: "Не удалось обновить заметку" });
  }
}

async function handleDelete(req: any, res: any) {
  const payload = parseDeleteBody(req.body);

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

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    if (!requireAdminRequest(req, res)) {
      return;
    }

    return handleList(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdminRequest(req, res)) {
    return;
  }

  const action = getSingleQueryValue(req.query?.action).trim();

  if (action === "create") {
    return handleCreate(req, res);
  }

  if (action === "update") {
    return handleUpdate(req, res);
  }

  if (action === "delete") {
    return handleDelete(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
