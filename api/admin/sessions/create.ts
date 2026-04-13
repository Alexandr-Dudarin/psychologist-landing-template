/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionStatus,
} from "../../../src/types/session";
import { sessionStatuses } from "../../../src/types/session";

type ParsedPayload = {
  clientId: number;
  serviceId: number;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  notes: string;
  source: string;
};

type SessionRow = {
  id: number;
  client_id: number;
  client_name: string;
  service_id: number;
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
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    serviceId: row.service_id,
    serviceTitle: row.service_title,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    price: Number(row.price),
    status: toSessionStatus(row.status),
    notes: row.notes,
    source: row.source,
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для создания сессии.",
    });
  }

  try {
    const result = await pool.query<SessionRow>(
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
        RETURNING
          id,
          client_id,
          service_id,
          scheduled_at,
          duration_minutes,
          price,
          status,
          notes,
          source,
          created_at
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
      [created.id]
    );

    return res.status(200).json({
      success: true,
      item: mapSession(joined.rows[0]),
    });
  } catch (error) {
    console.error("Session create error:", error);
    return res.status(500).json({ error: "Не удалось создать сессию" });
  }
}