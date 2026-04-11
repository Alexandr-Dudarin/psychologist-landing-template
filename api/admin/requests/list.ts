/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmRequestRecord } from "../../../src/types/request";

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

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query<RequestRow>(`
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
      ORDER BY created_at DESC
    `);

    const items: CrmRequestRecord[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      status: row.status,
      source: row.source,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Requests list error:", error);
    return res.status(500).json({ error: "Failed to load requests" });
  }
}