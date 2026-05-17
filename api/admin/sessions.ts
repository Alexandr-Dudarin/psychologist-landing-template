/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import { processSessionReminders } from "../../server/reminders/processSessionReminders.js";
import type {
  CrmSessionRecord,
  SessionListScope,
  SessionStatus,
} from "../../src/types/session.js";
import {
  sessionListScopes,
  sessionStatuses,
} from "../../src/types/session.js";

type ParsedCreatePayload = {
  clientId: number;
  serviceId: number;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  notes: string;
  source: string;
  clientPackageId: number | null;
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
  clientPackageId: number | null;
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
  client_package_id: string | number | null;
  client_package_code: string | null;
  client_package_title: string | null;
  created_at: string;
};

type ClientPackageValidationRow = {
  id: string | number;
  client_id: string | number;
  service_id: string | number;
  service_duration_minutes: string | number;
  status: string;
  sessions_count: string | number;
  used_sessions_count: string | number;
};

type SessionOverlapRow = {
  id: string | number;
  client_name: string;
  scheduled_at: string;
  duration_minutes: string | number;
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

function getSingleHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseOptionalId(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
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
    clientPackageId:
      row.client_package_id === null ? null : Number(row.client_package_id),
    clientPackageCode: row.client_package_code,
    clientPackageTitle: row.client_package_title,
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

function getDateTimestamp(value: string): number | null {
  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasScheduledAtChanged(
  currentValue: string,
  nextValue: string
): boolean {
  const currentTimestamp = getDateTimestamp(currentValue);
  const nextTimestamp = getDateTimestamp(nextValue);

  if (currentTimestamp === null || nextTimestamp === null) {
    return true;
  }

  return Math.abs(currentTimestamp - nextTimestamp) > 1000;
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
  const clientPackageId = parseOptionalId(rawBody?.clientPackageId);

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

  if (clientPackageId === undefined) {
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
    clientPackageId,
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
  const clientPackageId = parseOptionalId(rawBody?.clientPackageId);

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

  if (clientPackageId === undefined) {
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
    clientPackageId,
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
        s.client_package_id,
        csp.code AS client_package_code,
        spp.title AS client_package_title,
        s.created_at
      FROM sessions s
      INNER JOIN clients c ON c.id = s.client_id
      INNER JOIN services sv ON sv.id = s.service_id
      LEFT JOIN client_service_packages csp ON csp.id = s.client_package_id
      LEFT JOIN service_package_plans spp ON spp.id = csp.package_plan_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [id]
  );
}

async function selectClientPackageForSession(
  clientPackageId: number,
  currentSessionId: number | null
): Promise<ClientPackageValidationRow | null> {
  const result = await pool.query<ClientPackageValidationRow>(
    `
      SELECT
        csp.id,
        csp.client_id,
        spp.service_id,
        sv.duration_minutes AS service_duration_minutes,
        csp.status,
        spp.sessions_count,
        (
          SELECT COUNT(*)
          FROM sessions s
          WHERE s.client_package_id = csp.id
            AND s.status IN ('scheduled', 'completed', 'no_show')
            AND ($2::bigint IS NULL OR s.id <> $2)
        ) AS used_sessions_count
      FROM client_service_packages csp
      INNER JOIN service_package_plans spp ON spp.id = csp.package_plan_id
      INNER JOIN services sv ON sv.id = spp.service_id
      WHERE csp.id = $1
      LIMIT 1
    `,
    [clientPackageId, currentSessionId]
  );

  return result.rows[0] ?? null;
}

async function validateClientPackageForSession(
  payload: ParsedCreatePayload | ParsedUpdatePayload,
  currentSessionId: number | null = null
): Promise<{ error: string | null; durationMinutes: number | null }> {
  if (!payload.clientPackageId) {
    return {
      error: null,
      durationMinutes: null,
    };
  }

  const clientPackage = await selectClientPackageForSession(
    payload.clientPackageId,
    currentSessionId
  );

  if (!clientPackage) {
    return {
      error: "Пакет клиента не найден.",
      durationMinutes: null,
    };
  }

  if (Number(clientPackage.client_id) !== payload.clientId) {
    return {
      error: "Выбранный пакет не принадлежит этому клиенту.",
      durationMinutes: null,
    };
  }

  if (Number(clientPackage.service_id) !== payload.serviceId) {
    return {
      error: "Выбранный пакет привязан к другой базовой услуге.",
      durationMinutes: null,
    };
  }

  if (clientPackage.status !== "active") {
    return {
      error: "Этот пакет клиента уже не активен.",
      durationMinutes: null,
    };
  }

  const totalSessions = Number(clientPackage.sessions_count);
  const usedSessions = Number(clientPackage.used_sessions_count);

  if (payload.status !== "cancelled" && usedSessions >= totalSessions) {
    return {
      error: "В этом пакете больше нет доступных сессий.",
      durationMinutes: null,
    };
  }

  return {
    error: null,
    durationMinutes: Number(clientPackage.service_duration_minutes),
  };
}

async function findSessionTimeOverlap(
  scheduledAt: string,
  durationMinutes: number,
  currentSessionId: number | null = null
): Promise<SessionOverlapRow | null> {
  const result = await pool.query<SessionOverlapRow>(
    `
      WITH target AS (
        SELECT
          $1::timestamptz AS scheduled_at,
          $2::int AS duration_minutes,
          COALESCE(
            (
              SELECT buffer_minutes::int
              FROM booking_settings
              WHERE id = 1
              LIMIT 1
            ),
            0
          ) AS buffer_minutes
      )
      SELECT
        s.id,
        c.name AS client_name,
        s.scheduled_at,
        s.duration_minutes
      FROM sessions s
      INNER JOIN clients c ON c.id = s.client_id
      CROSS JOIN target t
      WHERE s.status <> 'cancelled'
        AND ($3::bigint IS NULL OR s.id <> $3)
        AND tstzrange(
          s.scheduled_at,
          s.scheduled_at + ((s.duration_minutes::int + t.buffer_minutes) * INTERVAL '1 minute'),
          '[)'
        ) && tstzrange(
          t.scheduled_at,
          t.scheduled_at + ((t.duration_minutes + t.buffer_minutes) * INTERVAL '1 minute'),
          '[)'
        )
      ORDER BY s.scheduled_at ASC
      LIMIT 1
    `,
    [scheduledAt, durationMinutes, currentSessionId]
  );

  return result.rows[0] ?? null;
}

function getSessionOverlapError(overlap: SessionOverlapRow): string {
  return [
    "Это время уже занято другой сессией или перерывом после неё.",
    `Конфликт с записью клиента: ${overlap.client_name}.`,
    "Выберите другое время.",
  ].join(" ");
}

async function handleList(req: any, res: any) {
  const status = getSingleQueryValue(req.query?.status).trim();
  const scope = getSingleQueryValue(req.query?.scope).trim();
  const clientIdRaw = getSingleQueryValue(req.query?.clientId).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (scope && !sessionListScopes.includes(scope as SessionListScope)) {
    return res.status(400).json({ error: "Некорректный режим списка" });
  }

  if (scope === "active") {
    conditions.push(`s.status = 'scheduled'`);
  }

  if (scope === "archived") {
    conditions.push(`s.status IN ('completed', 'cancelled', 'no_show')`);
  }

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
        OR csp.code ILIKE $${searchIndex}
        OR spp.title ILIKE $${searchIndex}
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
          s.client_package_id,
          csp.code AS client_package_code,
          spp.title AS client_package_title,
          s.created_at
        FROM sessions s
        INNER JOIN clients c ON c.id = s.client_id
        INNER JOIN services sv ON sv.id = s.service_id
        LEFT JOIN client_service_packages csp ON csp.id = s.client_package_id
        LEFT JOIN service_package_plans spp ON spp.id = csp.package_plan_id
        ${whereClause}
        ORDER BY
          CASE
            WHEN s.status = 'scheduled' AND s.scheduled_at >= NOW() THEN 0
            WHEN s.status = 'scheduled' AND s.scheduled_at < NOW() THEN 1
            ELSE 2
          END ASC,
          CASE
            WHEN s.status = 'scheduled' AND s.scheduled_at >= NOW()
            THEN s.scheduled_at
          END ASC NULLS LAST,
          s.scheduled_at DESC
      `,
      values
    );

    const items: CrmSessionRecord[] = result.rows.map(mapSession);

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
    const packageValidation = await validateClientPackageForSession(payload);

    if (packageValidation.error) {
      return res.status(400).json({
        error: packageValidation.error,
      });
    }

    const storedDurationMinutes = payload.durationMinutes;
    const storedPrice = payload.clientPackageId ? 0 : payload.price;

    if (payload.status !== "cancelled") {
      const overlap = await findSessionTimeOverlap(
        payload.scheduledAt,
        storedDurationMinutes
      );

      if (overlap) {
        return res.status(409).json({
          error: getSessionOverlapError(overlap),
        });
      }
    }

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
          source,
          client_package_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        payload.clientId,
        payload.serviceId,
        payload.scheduledAt,
        storedDurationMinutes,
        storedPrice,
        payload.status,
        payload.notes,
        payload.source,
        payload.clientPackageId,
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

  try {
    const existingResult = await selectSession(payload.id);
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ error: "Сессия не найдена" });
    }

    if (
      hasScheduledAtChanged(existing.scheduled_at, payload.scheduledAt) &&
      isPastScheduledAt(payload.scheduledAt)
    ) {
      return res.status(400).json({
        error: "Нельзя перенести сессию в прошлое.",
      });
    }

    const packageValidation = await validateClientPackageForSession(
      payload,
      payload.id
    );

    if (packageValidation.error) {
      return res.status(400).json({
        error: packageValidation.error,
      });
    }

    const storedDurationMinutes = payload.durationMinutes;
    const storedPrice = payload.clientPackageId ? 0 : payload.price;

    if (payload.status !== "cancelled") {
      const overlap = await findSessionTimeOverlap(
        payload.scheduledAt,
        storedDurationMinutes,
        payload.id
      );

      if (overlap) {
        return res.status(409).json({
          error: getSessionOverlapError(overlap),
        });
      }
    }

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
          notes = $7,
          client_package_id = $8
        WHERE id = $9
        RETURNING id
      `,
      [
        payload.clientId,
        payload.serviceId,
        payload.scheduledAt,
        storedDurationMinutes,
        storedPrice,
        payload.status,
        payload.notes,
        payload.clientPackageId,
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

async function handleProcessReminders(req: any, res: any) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return res.status(500).json({
      error: "CRON_SECRET is not configured",
    });
  }

  const providedSecret = getSingleHeaderValue(
    req.headers?.["x-cron-secret"]
  ).trim();

  if (!providedSecret || providedSecret !== cronSecret) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const result = await processSessionReminders();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Session reminders process error:", error);

    return res.status(500).json({
      error: "Failed to process session reminders",
    });
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

  if (action === "process-reminders") {
    return handleProcessReminders(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}