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

  const activity = getSingleQueryValue(req.query?.activity).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: Array<string | boolean> = [];

  if (activity && activity !== "all") {
    if (activity !== "active" && activity !== "inactive") {
      return res.status(400).json({ error: "Invalid activity filter" });
    }

    values.push(activity === "active");
    conditions.push(`is_active = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchParamIndex = values.length;

    conditions.push(`
      (
        title ILIKE $${searchParamIndex}
        OR description ILIKE $${searchParamIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values
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
    console.error("Services list error:", error);
    return res.status(500).json({ error: "Не удалось загрузить услуги" });
  }
}