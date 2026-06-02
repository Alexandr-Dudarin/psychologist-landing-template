/// <reference types="node" />

import { requireAdminRequest } from "../../server/auth/requireAdmin.js";
import { pool } from "../../server/db/pool.js";
import type {
  CrmRequestRecord,
  RequestStatus,
  UpdateRequestStatusPayload,
} from "../../src/types/request.js";
import { requestStatuses } from "../../src/types/request.js";
import type { PreferredContactMethod } from "../../src/types/preferredContact.js";

type ParsedUpdatePayload = UpdateRequestStatusPayload | null;
type RequestListScope = "all" | "active" | "old";

const OLD_REQUESTS_LIMIT_FALLBACK = 100;
const OLD_REQUESTS_MAX_LIMIT = 100;

type RequestRow = {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  source: string;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
  created_at: string;
  client_id: string | number | null;
};

function toRequestStatus(value: string): RequestStatus {
  if (requestStatuses.includes(value as RequestStatus)) {
    return value as RequestStatus;
  }

  return "new";
}

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseRequestListScope(value: string): RequestListScope | null {
  if (!value) {
    return "all";
  }

  if (value === "all" || value === "active" || value === "old") {
    return value;
  }

  return null;
}

function parseLimit(value: string, fallback: number | null): number | null {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, OLD_REQUESTS_MAX_LIMIT);
}

function parseOffset(value: string): number | null {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseUpdatePayload(body: any): ParsedUpdatePayload {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);
  const status = rawBody?.status;

  if (!Number.isInteger(id)) {
    return null;
  }

  if (typeof status !== "string") {
    return null;
  }

  if (!requestStatuses.includes(status as RequestStatus)) {
    return null;
  }

  return {
    id,
    status: status as RequestStatus,
  };
}

function mapRequestRow(row: RequestRow): CrmRequestRecord {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    status: toRequestStatus(row.status),
    source: row.source,
    preferredContactMethod:
      row.preferred_contact_method as PreferredContactMethod | null,
    preferredContactValue: row.preferred_contact_value,
    createdAt: row.created_at,
    clientId: row.client_id === null ? null : Number(row.client_id),
  };
}

async function handleList(req: any, res: any) {
  const status = getSingleQueryValue(req.query?.status).trim();
  const search = getSingleQueryValue(req.query?.search).trim();
  const scopeRaw = getSingleQueryValue(req.query?.scope).trim();
  const limitRaw = getSingleQueryValue(req.query?.limit).trim();
  const offsetRaw = getSingleQueryValue(req.query?.offset).trim();

  const scope = parseRequestListScope(scopeRaw);

  if (!scope) {
    return res.status(400).json({ error: "Invalid request scope" });
  }

  const limit = parseLimit(
    limitRaw,
    scope === "old" ? OLD_REQUESTS_LIMIT_FALLBACK : null
  );

  if (limitRaw && limit === null) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  const offset = parseOffset(offsetRaw);

  if (offset === null) {
    return res.status(400).json({ error: "Invalid offset" });
  }

  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (scope === "active") {
    conditions.push(`r.created_at::date > CURRENT_DATE - INTERVAL '32 days'`);
  }

  if (scope === "old") {
    conditions.push(`r.created_at::date <= CURRENT_DATE - INTERVAL '32 days'`);
  }

  if (status && status !== "all") {
    if (!requestStatuses.includes(status as RequestStatus)) {
      return res.status(400).json({ error: "Invalid status filter" });
    }

    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchParamIndex = values.length;

    conditions.push(`
      (
        CAST(r.id AS TEXT) ILIKE $${searchParamIndex}
        OR r.name ILIKE $${searchParamIndex}
        OR r.phone ILIKE $${searchParamIndex}
        OR r.email ILIKE $${searchParamIndex}
        OR r.preferred_contact_value ILIKE $${searchParamIndex}
        OR r.message ILIKE $${searchParamIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let paginationClause = "";

  if (limit !== null) {
    values.push(limit + 1);
    const limitParamIndex = values.length;

    values.push(offset);
    const offsetParamIndex = values.length;

    paginationClause = `
      LIMIT $${limitParamIndex}
      OFFSET $${offsetParamIndex}
    `;
  }

  try {
    const result = await pool.query<RequestRow>(
      `
        SELECT
          r.id,
          r.name,
          r.phone,
          r.email,
          r.message,
          r.status,
          r.source,
          r.preferred_contact_method,
          r.preferred_contact_value,
          r.created_at,
          r.client_id
        FROM requests r
        ${whereClause}
        ORDER BY r.created_at DESC
        ${paginationClause}
      `,
      values
    );

    const rows = limit === null ? result.rows : result.rows.slice(0, limit);
    const items = rows.map(mapRequestRow);

    if (limit !== null) {
      return res.status(200).json({
        items,
        hasMore: result.rows.length > limit,
      });
    }

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Requests list error:", error);
    return res.status(500).json({ error: "Failed to load requests" });
  }
}

async function handleUpdate(req: any, res: any) {
  const payload = parseUpdatePayload(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const result = await pool.query<{ id: number; status: RequestStatus }>(
      `
        UPDATE requests
        SET status = $1
        WHERE id = $2
        RETURNING id, status
      `,
      [payload.status, payload.id]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Request not found" });
    }

    return res.status(200).json({
      success: true,
      item: updated,
    });
  } catch (error) {
    console.error("Request update error:", error);
    return res.status(500).json({ error: "Failed to update request status" });
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

  if (action === "update") {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}