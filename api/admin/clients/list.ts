/// <reference types="node" />

import { pool } from "../../../server/db/pool.js";
import type { CrmClientRecord, ClientStatus } from "../../../src/types/client.js";
import { clientStatuses } from "../../../src/types/client.js";

type ClientRow = {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  first_request_id: string | number | null;
  created_at: string;
};

function toClientStatus(value: string): ClientStatus {
  if (clientStatuses.includes(value as ClientStatus)) {
    return value as ClientStatus;
  }

  return "active";
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
    if (!clientStatuses.includes(status as ClientStatus)) {
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
        CAST(id AS TEXT) ILIKE $${searchParamIndex}
        OR name ILIKE $${searchParamIndex}
        OR phone ILIKE $${searchParamIndex}
        OR email ILIKE $${searchParamIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query<ClientRow>(
      `
        SELECT
          id,
          name,
          phone,
          email,
          source,
          status,
          first_request_id,
          created_at
        FROM clients
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values
    );

    const items: CrmClientRecord[] = result.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      phone: row.phone,
      email: row.email,
      source: row.source,
      status: toClientStatus(row.status),
      firstRequestId:
        row.first_request_id === null ? null : Number(row.first_request_id),
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Clients list error:", error);
    return res.status(500).json({ error: "Failed to load clients" });
  }
}