/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmClientRecord, ClientStatus } from "../../../src/types/client";

type ClientRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  first_request_id: number | null;
  created_at: string;
};

function toClientStatus(value: string): ClientStatus {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "active";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query<ClientRow>(`
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
      ORDER BY created_at DESC
    `);

    const items: CrmClientRecord[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      source: row.source,
      status: toClientStatus(row.status),
      firstRequestId: row.first_request_id,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Clients list error:", error);
    return res.status(500).json({ error: "Failed to load clients" });
  }
}