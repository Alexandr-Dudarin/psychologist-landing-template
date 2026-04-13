/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  CrmSessionRecord,
  SessionStatus,
} from "../../../src/types/session";
import { sessionStatuses } from "../../../src/types/session";

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

  const status = getSingleQueryValue(req.query?.status).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: string[] = [];

  if (status && status !== "all") {
    if (!sessionStatuses.includes(status as SessionStatus)) {
      return res.status(400).json({ error: "Некорректный фильтр статуса" });
    }

    values.push(status);
    conditions.push(`s.status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchParamIndex = values.length;

    conditions.push(`
      (
        c.name ILIKE $${searchParamIndex}
        OR sv.title ILIKE $${searchParamIndex}
        OR s.notes ILIKE $${searchParamIndex}
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
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Sessions list error:", error);
    return res.status(500).json({ error: "Не удалось загрузить сессии" });
  }
}