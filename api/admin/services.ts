/// <reference types="node" />

import { requireAdminRequest } from "../../server/auth/requireAdmin.js";
import { pool } from "../../server/db/pool.js";
import type {
  CreateServicePackagePlanPayload,
  CrmServicePackagePlanRecord,
  CrmServiceRecord,
  UpdateServicePackagePlanPayload,
} from "../../src/types/service.js";

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

type ParsedCreatePackagePlanPayload = CreateServicePackagePlanPayload;

type ParsedUpdatePackagePlanPayload = UpdateServicePackagePlanPayload;

type ParsedDeletePackagePlanPayload = {
  id: number;
};

type ParsedHidePackagePlanPayload = {
  id: number;
};

type ServiceRow = {
  id: number;
  title: string;
  description: string;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  sessions_count: string | number;
  created_at: string;
};

type ServicePackagePlanRow = {
  id: number | string;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  service_is_active: boolean;
  title: string;
  description: string;
  sessions_count: number | string;
  price: string | number;
  is_active: boolean;
  client_packages_count: number | string;
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
    sessionsCount: Number(row.sessions_count),
    createdAt: row.created_at,
  };
}

function mapPackagePlan(
  row: ServicePackagePlanRow
): CrmServicePackagePlanRecord {
  return {
    id: Number(row.id),
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    serviceDurationMinutes: Number(row.service_duration_minutes),
    serviceIsActive: row.service_is_active,
    title: row.title,
    description: row.description,
    sessionsCount: Number(row.sessions_count),
    price: Number(row.price),
    isActive: row.is_active,
    clientPackagesCount: Number(row.client_packages_count),
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

function parseCreatePackagePlanBody(
  body: any
): ParsedCreatePackagePlanPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const serviceId = Number(rawBody?.serviceId);
  const title =
    typeof rawBody?.title === "string" ? rawBody.title.trim() : "";
  const description =
    typeof rawBody?.description === "string" ? rawBody.description.trim() : "";
  const sessionsCount = Number(rawBody?.sessionsCount);
  const price = Number(rawBody?.price);
  const isActive =
    typeof rawBody?.isActive === "boolean" ? rawBody.isActive : true;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  if (!title) {
    return null;
  }

  if (!Number.isInteger(sessionsCount) || sessionsCount <= 0) {
    return null;
  }

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    serviceId,
    title,
    description,
    sessionsCount,
    price,
    isActive,
  };
}

function parseUpdatePackagePlanBody(
  body: any
): ParsedUpdatePackagePlanPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);
  const serviceId = Number(rawBody?.serviceId);
  const title =
    typeof rawBody?.title === "string" ? rawBody.title.trim() : "";
  const description =
    typeof rawBody?.description === "string" ? rawBody.description.trim() : "";
  const sessionsCount = Number(rawBody?.sessionsCount);
  const price = Number(rawBody?.price);
  const isActive =
    typeof rawBody?.isActive === "boolean" ? rawBody.isActive : false;

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  if (!title) {
    return null;
  }

  if (!Number.isInteger(sessionsCount) || sessionsCount <= 0) {
    return null;
  }

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    id,
    serviceId,
    title,
    description,
    sessionsCount,
    price,
    isActive,
  };
}

function parseDeletePackagePlanBody(
  body: any
): ParsedDeletePackagePlanPayload | null {
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

function parseHidePackagePlanBody(
  body: any
): ParsedHidePackagePlanPayload | null {
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

async function getServiceSessionsCount(serviceId: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM sessions
      WHERE service_id = $1
    `,
    [serviceId]
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function getServicePackagePlansCount(serviceId: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM service_package_plans
      WHERE service_id = $1
    `,
    [serviceId]
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function getClientPackagesCountByPackagePlan(
  packagePlanId: number
): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM client_service_packages
      WHERE package_plan_id = $1
    `,
    [packagePlanId]
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function selectPackagePlan(id: string | number) {
  return pool.query<ServicePackagePlanRow>(
    `
      SELECT
        p.id,
        p.service_id,
        s.title AS service_title,
        s.duration_minutes AS service_duration_minutes,
        s.is_active AS service_is_active,
        p.title,
        p.description,
        p.sessions_count,
        p.price,
        p.is_active,
        (
          SELECT COUNT(*)
          FROM client_service_packages csp
          WHERE csp.package_plan_id = p.id
        ) AS client_packages_count,
        p.created_at
      FROM service_package_plans p
      INNER JOIN services s ON s.id = p.service_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [id]
  );
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
          (
            SELECT COUNT(*)
            FROM sessions
            WHERE sessions.service_id = services.id
          ) AS sessions_count,
          created_at
        FROM services
        ${whereClause}
        ORDER BY is_active DESC, created_at DESC
      `,
      values
    );

    const items: CrmServiceRecord[] = result.rows.map(mapService);

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Services list error:", error);
    return res.status(500).json({ error: "Не удалось загрузить услуги" });
  }
}

async function handleListPackagePlans(_req: any, res: any) {
  try {
    const result = await pool.query<ServicePackagePlanRow>(
      `
        SELECT
          p.id,
          p.service_id,
          s.title AS service_title,
          s.duration_minutes AS service_duration_minutes,
          s.is_active AS service_is_active,
          p.title,
          p.description,
          p.sessions_count,
          p.price,
          p.is_active,
          (
            SELECT COUNT(*)
            FROM client_service_packages csp
            WHERE csp.package_plan_id = p.id
          ) AS client_packages_count,
          p.created_at
        FROM service_package_plans p
        INNER JOIN services s ON s.id = p.service_id
        ORDER BY
          p.is_active DESC,
          s.is_active DESC,
          p.created_at DESC
      `
    );

    const items: CrmServicePackagePlanRecord[] =
      result.rows.map(mapPackagePlan);

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Service package plans list error:", error);
    return res.status(500).json({ error: "Не удалось загрузить пакеты услуг" });
  }
}

async function handleCreate(req: any, res: any) {
  const payload = parseCreateBody(req.body);

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
          0 AS sessions_count,
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

async function handleCreatePackagePlan(req: any, res: any) {
  const payload = parseCreatePackagePlanBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error:
        "Некорректные данные. Выберите услугу, укажите название, количество сессий и цену пакета.",
    });
  }

  try {
    const result = await pool.query<{ id: number }>(
      `
        INSERT INTO service_package_plans (
          service_id,
          title,
          description,
          sessions_count,
          price,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        payload.serviceId,
        payload.title,
        payload.description ?? "",
        payload.sessionsCount,
        payload.price,
        payload.isActive ?? true,
      ]
    );

    const created = result.rows[0];
    const joined = await selectPackagePlan(created.id);

    return res.status(200).json({
      success: true,
      item: mapPackagePlan(joined.rows[0]),
    });
  } catch (error) {
    console.error("Service package plan create error:", error);
    return res.status(500).json({ error: "Не удалось создать пакет услуг" });
  }
}

async function handleUpdate(req: any, res: any) {
  const payload = parseUpdateBody(req.body);

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
          (
            SELECT COUNT(*)
            FROM sessions
            WHERE sessions.service_id = services.id
          ) AS sessions_count,
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

async function handleUpdatePackagePlan(req: any, res: any) {
  const payload = parseUpdatePackagePlanBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления пакета услуг.",
    });
  }

  try {
    const result = await pool.query<{ id: number }>(
      `
        UPDATE service_package_plans
        SET
          service_id = $1,
          title = $2,
          description = $3,
          sessions_count = $4,
          price = $5,
          is_active = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING id
      `,
      [
        payload.serviceId,
        payload.title,
        payload.description ?? "",
        payload.sessionsCount,
        payload.price,
        payload.isActive,
        payload.id,
      ]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Пакет услуг не найден" });
    }

    const joined = await selectPackagePlan(updated.id);

    return res.status(200).json({
      success: true,
      item: mapPackagePlan(joined.rows[0]),
    });
  } catch (error) {
    console.error("Service package plan update error:", error);
    return res.status(500).json({ error: "Не удалось обновить пакет услуг" });
  }
}

async function handleHidePackagePlan(req: any, res: any) {
  const payload = parseHidePackagePlanBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректный id пакета услуг" });
  }

  try {
    const result = await pool.query<{ id: number }>(
      `
        UPDATE service_package_plans
        SET
          is_active = FALSE,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Пакет услуг не найден" });
    }

    const joined = await selectPackagePlan(updated.id);

    return res.status(200).json({
      success: true,
      item: mapPackagePlan(joined.rows[0]),
    });
  } catch (error) {
    console.error("Service package plan hide error:", error);
    return res.status(500).json({ error: "Не удалось скрыть пакет услуг" });
  }
}

async function handleDelete(req: any, res: any) {
  const payload = parseDeleteBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректный id услуги" });
  }

  try {
    const sessionsCount = await getServiceSessionsCount(payload.id);

    if (sessionsCount > 0) {
      return res.status(409).json({
        error:
          "Эту услугу нельзя удалить, потому что по ней уже есть записи. Вы можете скрыть её из онлайн-записи.",
      });
    }

    const packagePlansCount = await getServicePackagePlansCount(payload.id);

    if (packagePlansCount > 0) {
      return res.status(409).json({
        error:
          "Эту услугу нельзя удалить, потому что на её основе уже созданы пакеты. Сначала удалите или отключите связанные пакеты.",
      });
    }

    const result = await pool.query<{ id: number }>(
      `
        DELETE FROM services
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Услуга не найдена" });
    }

    return res.status(200).json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Service delete error:", error);
    return res.status(500).json({ error: "Не удалось удалить услугу" });
  }
}

async function handleDeletePackagePlan(req: any, res: any) {
  const payload = parseDeletePackagePlanBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректный id пакета услуг" });
  }

  try {
    const clientPackagesCount = await getClientPackagesCountByPackagePlan(
      payload.id
    );

    if (clientPackagesCount > 0) {
      return res.status(409).json({
        error:
          "Этот пакет нельзя удалить, потому что он уже выдан клиентам. Можно скрыть его из новых записей.",
      });
    }

    const result = await pool.query<{ id: number }>(
      `
        DELETE FROM service_package_plans
        WHERE id = $1
        RETURNING id
      `,
      [payload.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Пакет услуг не найден" });
    }

    return res.status(200).json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error) {
    const pgError = error as { code?: string };

    if (pgError.code === "23503") {
      return res.status(409).json({
        error:
          "Этот пакет нельзя удалить, потому что он уже используется. Можно скрыть его из новых записей.",
      });
    }

    console.error("Service package plan delete error:", error);
    return res.status(500).json({ error: "Не удалось удалить пакет услуг" });
  }
}

export default async function handler(req: any, res: any) {
  const action = getSingleQueryValue(req.query?.action).trim();

  if (req.method === "GET") {
    if (!requireAdminRequest(req, res)) {
      return;
    }

    if (action === "list-package-plans") {
      return handleListPackagePlans(req, res);
    }

    return handleList(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdminRequest(req, res)) {
    return;
  }

  if (action === "create") {
    return handleCreate(req, res);
  }

  if (action === "update") {
    return handleUpdate(req, res);
  }

  if (action === "delete") {
    return handleDelete(req, res);
  }

  if (action === "create-package-plan") {
    return handleCreatePackagePlan(req, res);
  }

  if (action === "update-package-plan") {
    return handleUpdatePackagePlan(req, res);
  }

  if (action === "hide-package-plan") {
    return handleHidePackagePlan(req, res);
  }

  if (action === "delete-package-plan") {
    return handleDeletePackagePlan(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
