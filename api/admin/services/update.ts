/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  CrmServiceRecord,
  UpdateServicePayload,
} from "../../../src/types/service";

type ParsedPayload = {
  id: number;
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

  const id = Number(rawBody?.id);
  const title =
    typeof rawBody?.title === "string" ? rawBody.title.trim() : "";
  const description =
    typeof rawBody?.description === "string" ? rawBody.description.trim() : "";
  const price = Number(rawBody?.price);
  const durationMinutes = Number(rawBody?.durationMinutes);
  const isActive =
    typeof rawBody?.isActive === "boolean" ? rawBody.isActive : false;

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

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
    id,
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
      error: "Некорректные данные для обновления услуги.",
    });
  }

  try {
    const result = await pool.query<ServiceRow>(
      `
        UPDATE services
        SET
          title = $1,
          description = $2,
          price = $3,
          duration_minutes = $4,
          is_active = $5
        WHERE id = $6
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
        payload.id,
      ]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Услуга не найдена" });
    }

    return res.status(200).json({
      success: true,
      item: mapService(updated),
    });
  } catch (error) {
    console.error("Service update error:", error);
    return res.status(500).json({ error: "Не удалось обновить услугу" });
  }
}