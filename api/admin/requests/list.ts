/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  CrmRequestRecord,
  RequestStatus,
} from "../../../src/types/request";
import { requestStatuses } from "../../../src/types/request";

type RequestRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  source: string;
  created_at: string;
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
    conditions.push(`status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchParamIndex = values.length;

    conditions.push(`
      (
        name ILIKE $${searchParamIndex}
        OR phone ILIKE $${searchParamIndex}
        OR email ILIKE $${searchParamIndex}
        OR message ILIKE $${searchParamIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query<RequestRow>(
      `
        SELECT
          id,
          name,
          phone,
          email,
          message,
          status,
          source,
          created_at
        FROM requests
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values
    );

    const items: CrmRequestRecord[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      status: toRequestStatus(row.status),
      source: row.source,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Requests list error:", error);
    return res.status(500).json({ error: "Failed to load requests" });
  }
}