/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import type {
  CrmSessionRecord,
  SessionStatus,
} from "../../src/types/session.js";
import { sessionStatuses } from "../../src/types/session.js";

type ParsedCreatePayload = {
  clientId: number;
  serviceId: number;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  notes: string;
  source: string;
};

type ParsedUpdatePayload = {
  id: number;
  clientId: number;
  serviceId: number;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  notes: string;
};

type ParsedDeletePayload = {
  id: number;
};

type SessionRow = {
  id: string | number;
  client_id: string | number;
  client_name: string;
  service_id: string | number;
  service_title: string;
  scheduled_at: string;
  duration_minutes: number | string;
  price: number | string;
  status: string;
  notes: string;
  source: string;
  created_at: string;
};

function toSessionStatus(value: string): SessionStatus {
  if (sessionStatuses.includes(value as SessionStatus)) {
    return value as SessionStatus;
  }

  return "scheduled";
}

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function mapSession(row: SessionRow): CrmSessionRecord {
  return {
    id: Number(row.id),
    clientId: Number(row.client_id),
    clientName: row.client_name,
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    scheduledAt: row.scheduled_at,
    durationMinutes: Number(row.duration_minutes),
    price: Number(row.price),
    status: toSessionStatus(row.status),
    notes: row.notes,
    source: row.source,
    createdAt: row.created_at,
  };
}

function isPastScheduledAt(value: string): boolean {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < Date.now();
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
  const serviceId = Number(rawBody?.serviceId);
  const scheduledAt =
    typeof rawBody?.scheduledAt === "string" ? rawBody.scheduledAt.trim() : "";
  const durationMinutes = Number(rawBody?.durationMinutes);
  const price = Number(rawBody?.price);
  const status =
    typeof rawBody?.status === "string" &&
    sessionStatuses.includes(rawBody.status as SessionStatus)
      ? (rawBody.status as SessionStatus)
      : "scheduled";
  const notes =
    typeof rawBody?.notes === "string" ? rawBody.notes.trim() : "";
  const source =
    typeof rawBody?.source === "string" && rawBody.source.trim()
      ? rawBody.source.trim()
      : "manual";

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null;
  }

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
    return null;
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return null;
  }

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    clientId,
    serviceId,
    scheduledAt,
    durationMinutes,
    price,
    status,
    notes,
    source,
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
  const serviceId = Number(rawBody?.serviceId);
  const scheduledAt =
    typeof rawBody?.scheduledAt === "string" ? rawBody.scheduledAt.trim() : "";
  const durationMinutes = Number(rawBody?.durationMinutes);
  const price = Number(rawBody?.price);
  const status =
    typeof rawBody?.status === "string" &&
    sessionStatuses.includes(rawBody.status as SessionStatus)
      ? (rawBody.status as SessionStatus)
      : null;
  const notes =
    typeof rawBody?.notes === "string" ? rawBody.notes.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null;
  }

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
    return null;
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return null;
  }

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  if (!status) {
    return null;
  }

  return {
    id,
    clientId,
    serviceId,
    scheduledAt,
    durationMinutes,
    price,
    status,
    notes,
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

async function selectSession(id: string | number) {
  return pool.query<SessionRow>(
    `
      SELECT
        s.id,
        s.client_id,
        c.name AS client_name,
        s.service_id,
        sv.title AS service_title,
        s.scheduled_at,
        s.duration_minutes,
        s.price,
        s.status,
        s.notes,
        s.source,
        s.created_at
      FROM sessions s
      INNER JOIN clients c ON c.id = s.client_id
      INNER JOIN services sv ON sv.id = s.service_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [id]
  );
}

async function handleList(req: any, res: any) {
  const status = getSingleQueryValue(req.query?.status).trim();
  const clientIdRaw = getSingleQueryValue(req.query?.clientId).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (status && status !== "all") {
    if (!sessionStatuses.includes(status as SessionStatus)) {
      return res.status(400).json({ error: "Некорректный статус" });
    }

    values.push(status);
    conditions.push(`s.status = $${values.length}`);
  }

  if (clientIdRaw && clientIdRaw !== "all") {
    const clientId = Number(clientIdRaw);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({ error: "Некорректный клиент" });
    }

    values.push(clientId);
    conditions.push(`s.client_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchIndex = values.length;

    conditions.push(`
      (
        CAST(s.id AS TEXT) ILIKE $${searchIndex}
        OR c.name ILIKE $${searchIndex}
        OR sv.title ILIKE $${searchIndex}
        OR s.notes ILIKE $${searchIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query<SessionRow>(
      `
        SELECT
          s.id,
          s.client_id,
          c.name AS client_name,
          s.service_id,
          sv.title AS service_title,
          s.scheduled_at,
          s.duration_minutes,
          s.price,
          s.status,
          s.notes,
          s.source,
          s.created_at
        FROM sessions s
        INNER JOIN clients c ON c.id = s.client_id
        INNER JOIN services sv ON sv.id = s.service_id
        ${whereClause}
        ORDER BY s.scheduled_at DESC
      `,
      values
    );

    const items: CrmSessionRecord[] = result.rows.map((row) => ({
      id: Number(row.id),
      clientId: Number(row.client_id),
      clientName: row.client_name,
      serviceId: Number(row.service_id),
      serviceTitle: row.service_title,
      scheduledAt: row.scheduled_at,
      durationMinutes: Number(row.duration_minutes),
      price: Number(row.price),
      status: toSessionStatus(row.status),
      notes: row.notes,
      source: row.source,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Sessions list error:", error);
    return res.status(500).json({ error: "Не удалось загрузить сессии" });
  }
}

async function handleCreate(req: any, res: any) {
  const payload = parseCreateBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для создания сессии.",
    });
  }

  if (isPastScheduledAt(payload.scheduledAt)) {
    return res.status(400).json({
      error: "Нельзя создать сессию в прошлом.",
    });
  }

  try {
    const result = await pool.query<{ id: string | number }>(
      `
        INSERT INTO sessions (
          client_id,
          service_id,
          scheduled_at,
          duration_minutes,
          price,
          status,
          notes,
          source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        payload.clientId,
        payload.serviceId,
        payload.scheduledAt,
        payload.durationMinutes,
        payload.price,
        payload.status,
        payload.notes,
        payload.source,
      ]
    );

    const created = result.rows[0];
    const joined = await selectSession(created.id);

    return res.status(200).json({
      success: true,
      item: mapSession(joined.rows[0]),
    });
  } catch (error) {
    console.error("Session create error:", error);
    return res.status(500).json({ error: "Не удалось создать сессию" });
  }
}

async function handleUpdate(req: any, res: any) {
  const payload = parseUpdateBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления сессии.",
    });
  }

  if (isPastScheduledAt(payload.scheduledAt)) {
    return res.status(400).json({
      error: "Нельзя перенести сессию в прошлое.",
    });
  }

  try {
    const updatedResult = await pool.query<{ id: string | number }>(
      `
        UPDATE sessions
        SET
          client_id = $1,
          service_id = $2,
          scheduled_at = $3,
          duration_minutes = $4,
          price = $5,
          status = $6,
          notes = $7
        WHERE id = $8
        RETURNING id
      `,
      [
        payload.clientId,
        payload.serviceId,
        payload.scheduledAt,
        payload.durationMinutes,
        payload.price,
        payload.status,
        payload.notes,
        payload.id,
      ]
    );

    const updated = updatedResult.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Сессия не найдена" });
    }

    const joined = await selectSession(updated.id);

    return res.status(200).json({
      success: true,
      item: mapSession(joined.rows[0]),
    });
  } catch (error) {
    console.error("Session update error:", error);
    return res.status(500).json({ error: "Не удалось обновить сессию" });
  }
}

async function handleDelete(req: any, res: any) {
  const payload = parseDeleteBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректный id сессии" });
  }

  try {
    const result = await pool.query<{ id: string | number }>(
      `
        DELETE FROM sessions
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    const deleted = result.rows[0];

    if (!deleted) {
      return res.status(404).json({ error: "Сессия не найдена" });
    }

    return res.status(200).json({
      success: true,
      id: Number(deleted.id),
    });
  } catch (error) {
    console.error("Session delete error:", error);
    return res.status(500).json({ error: "Не удалось удалить сессию" });
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return handleList(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
