/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  CrmServiceRecord,
  CreateServicePayload,
} from "../../../src/types/service";

type ParsedPayload = {
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
};

type ServiceRow = {
  id: number;
  title: string;
  description: string;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
};

function mapService(row: ServiceRow): CrmServiceRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    durationMinutes: row.duration_minutes,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function parseBody(body: any): ParsedPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const title =
    typeof rawBody?.title === "string" ? rawBody.title.trim() : "";
  const description =
    typeof rawBody?.description === "string" ? rawBody.description.trim() : "";
  const price = Number(rawBody?.price);
  const durationMinutes = Number(rawBody?.durationMinutes);
  const isActive =
    typeof rawBody?.isActive === "boolean" ? rawBody.isActive : true;

  if (!title) {
    return null;
  }

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return null;
  }

  return {
    title,
    description,
    price,
    durationMinutes,
    isActive,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error:
        "Некорректные данные. Укажите название, цену и длительность услуги.",
    });
  }

  try {
    const result = await pool.query<ServiceRow>(
      `
        INSERT INTO services (
          title,
          description,
          price,
          duration_minutes,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          title,
          description,
          price,
          duration_minutes,
          is_active,
          created_at
      `,
      [
        payload.title,
        payload.description,
        payload.price,
        payload.durationMinutes,
        payload.isActive,
      ]
    );

    return res.status(200).json({
      success: true,
      item: mapService(result.rows[0]),
    });
  } catch (error) {
    console.error("Service create error:", error);
    return res.status(500).json({ error: "Не удалось создать услугу" });
  }
}