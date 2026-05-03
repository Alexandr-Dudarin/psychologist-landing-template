/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import type { CrmServiceRecord } from "../../src/types/service.js";

type ParsedCreatePayload = {
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
};

type ParsedUpdatePayload = ParsedCreatePayload & {
  id: number;
};

type ParsedDeletePayload = {
  id: number;
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

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

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

function parseCreateBody(body: any): ParsedCreatePayload | null {
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

function parseUpdateBody(body: any): ParsedUpdatePayload | null {
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

function parseDeleteBody(body: any): ParsedDeletePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { id };
}

async function handleList(req: any, res: any) {
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
    return res.status(500).json({ error: "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СѓСЃР»СѓРіРё" });
  }
}

async function handleCreate(req: any, res: any) {
  const payload = parseCreateBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error:
        "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ. РЈРєР°Р¶РёС‚Рµ РЅР°Р·РІР°РЅРёРµ, С†РµРЅСѓ Рё РґР»РёС‚РµР»СЊРЅРѕСЃС‚СЊ СѓСЃР»СѓРіРё.",
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
    return res.status(500).json({ error: "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СѓСЃР»СѓРіСѓ" });
  }
}

async function handleUpdate(req: any, res: any) {
  const payload = parseUpdateBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ СѓСЃР»СѓРіРё.",
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
      return res.status(404).json({ error: "РЈСЃР»СѓРіР° РЅРµ РЅР°Р№РґРµРЅР°" });
    }

    return res.status(200).json({
      success: true,
      item: mapService(updated),
    });
  } catch (error) {
    console.error("Service update error:", error);
    return res.status(500).json({ error: "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ СѓСЃР»СѓРіСѓ" });
  }
}

async function handleDelete(req: any, res: any) {
  const payload = parseDeleteBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ id СѓСЃР»СѓРіРё" });
  }

  try {
    const result = await pool.query<{ id: number }>(
      `
        DELETE FROM services
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "РЈСЃР»СѓРіР° РЅРµ РЅР°Р№РґРµРЅР°" });
    }

    return res.status(200).json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Service delete error:", error);
    return res.status(500).json({ error: "РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СѓСЃР»СѓРіСѓ" });
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

  if (action === "create") {
    return handleCreate(req, res);
  }

  if (action === "update") {
    return handleUpdate(req, res);
  }

  if (action === "delete") {
    return handleDelete(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
