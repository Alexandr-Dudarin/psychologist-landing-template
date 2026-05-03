/// <reference types="node" />

import { pool } from "../../../server/db/pool.js";
import type {
  CrmSessionRecord,
  SessionStatus,
} from "../../../src/types/session.js";
import { sessionStatuses } from "../../../src/types/session.js";

type ParsedPayload = {
  id: number;
  clientId: number;
  serviceId: number;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  notes: string;
};

type SessionRow = {
  id: string | number;
  client_id: string | number;
  client_name: string;
  service_id: string | number;
  service_title: string;
  scheduled_at: string;
  duration_minutes: number;
  price: string | number;
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

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

    const joined = await pool.query<SessionRow>(
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
      [updated.id]
    );

    return res.status(200).json({
      success: true,
      item: mapSession(joined.rows[0]),
    });
  } catch (error) {
    console.error("Session update error:", error);
    return res.status(500).json({ error: "Не удалось обновить сессию" });
  }
}