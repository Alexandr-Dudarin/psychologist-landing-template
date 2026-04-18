/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmSessionRecord, SessionStatus } from "../../../src/types/session";
import { sessionStatuses } from "../../../src/types/session";

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

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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