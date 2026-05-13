/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import type {
  CrmRequestRecord,
  RequestStatus,
  UpdateRequestStatusPayload,
} from "../../src/types/request.js";
import { requestStatuses } from "../../src/types/request.js";
import type { PreferredContactMethod } from "../../src/types/preferredContact.js";

type ParsedUpdatePayload = UpdateRequestStatusPayload | null;

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

async function handleList(req: any, res: any) {
  const status = getSingleQueryValue(req.query?.status).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: string[] = [];

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
      `,
      values
    );

    const items: CrmRequestRecord[] = result.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      status: toRequestStatus(row.status),
      source: row.source,
      preferredContactMethod: row.preferred_contact_method as PreferredContactMethod | null,
      preferredContactValue: row.preferred_contact_value,
      createdAt: row.created_at,
      clientId: row.client_id === null ? null : Number(row.client_id),
    }));

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
    return handleList(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = getSingleQueryValue(req.query?.action).trim();

  if (action === "update") {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
