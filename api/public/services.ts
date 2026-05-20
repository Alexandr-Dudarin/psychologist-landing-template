/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import { siteSettings } from "../../src/data/siteSettings.js";
import type {
  CrmServiceRecord,
  PublicServicePackagePlanRecord,
} from "../../src/types/service.js";

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
  title: string;
  description: string;
  sessions_count: number | string;
  price: string | number;
};

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
): PublicServicePackagePlanRecord {
  return {
    id: Number(row.id),
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    serviceDurationMinutes: Number(row.service_duration_minutes),
    title: row.title,
    description: row.description,
    sessionsCount: Number(row.sessions_count),
    price: Number(row.price),
  };
}

async function loadPublicServices(): Promise<CrmServiceRecord[]> {
  const result = await pool.query<ServiceRow>(
    `
      SELECT
        id,
        title,
        description,
        price,
        duration_minutes,
        is_active,
        0 AS sessions_count,
        created_at
      FROM services
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapService);
}

async function loadPublicPackagePlans(): Promise<
  PublicServicePackagePlanRecord[]
> {
  if (
    !siteSettings.servicePackages.enabled ||
    !siteSettings.servicePackages.publicPricingEnabled
  ) {
    return [];
  }

  const result = await pool.query<ServicePackagePlanRow>(
    `
      SELECT
        p.id,
        p.service_id,
        s.title AS service_title,
        s.duration_minutes AS service_duration_minutes,
        p.title,
        p.description,
        p.sessions_count,
        p.price
      FROM service_package_plans p
      INNER JOIN services s ON s.id = p.service_id
      WHERE p.is_active = TRUE
        AND s.is_active = TRUE
      ORDER BY p.created_at DESC
    `
  );

  return result.rows.map(mapPackagePlan);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [items, packagePlans] = await Promise.all([
      loadPublicServices(),
      loadPublicPackagePlans(),
    ]);

    return res.status(200).json({
      items,
      packagePlans,
    });
  } catch (error) {
    console.error("Public services list error:", error);
    return res.status(500).json({
      error: "Не удалось загрузить услуги для публичного прайса.",
    });
  }
}