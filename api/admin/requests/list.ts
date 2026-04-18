/// <reference types="node" />

import { pool } from "../../../server/db/pool";

const requestStatuses = [
  "new",
  "replied",
  "booked",
  "completed",
  "cancelled",
] as const;

type RequestStatus = (typeof requestStatuses)[number];

type CrmRequestRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: RequestStatus;
  source: string;
  createdAt: string;
  clientId: number | null;
};

type RequestRow = {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  source: string;
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

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
      createdAt: row.created_at,
      clientId: row.client_id === null ? null : Number(row.client_id),
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Requests list error:", error);
    return res.status(500).json({ error: "Failed to load requests" });
  }
}