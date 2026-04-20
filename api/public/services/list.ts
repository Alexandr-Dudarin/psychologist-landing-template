/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmServiceRecord } from "../../../src/types/service";

type ServiceRow = {
  id: number;
  title: string;
  description: string;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query<ServiceRow>(
      `
        SELECT
          id,
          title,
          description,
          price,
          duration_minutes,
          is_active,
          created_at
        FROM services
        WHERE is_active = TRUE
        ORDER BY created_at DESC
      `
    );

    const items: CrmServiceRecord[] = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      durationMinutes: row.duration_minutes,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Public services list error:", error);
    return res.status(500).json({
      error: "Не удалось загрузить услуги для публичного прайса.",
    });
  }
}
