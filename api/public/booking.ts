/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import {
  getPublicBookingAvailabilityData,
  getSingleQueryValue,
} from "../../server/publicBooking/bookingAvailability.js";
import {
  getPublicBookingValidationError,
  parsePublicBookingCreatePayload,
} from "../../server/publicBooking/parsePublicBookingCreatePayload.js";
import { sendBookingNotificationsBounded } from "../../server/publicBooking/sendBookingNotifications.js";
import {
  createBookingService,
  isCreateBookingServiceError,
} from "../../server/services/createBookingService.js";
import {
  checkRateLimit,
  sendRateLimitResponse,
  type RateLimitActionKey,
} from "../../server/utils/rateLimit.js";
import type {
  PublicBookingPackageInfo,
  PublicBookingPackageLookupPayload,
} from "../../src/types/booking.js";
import type { PreferredContactMethod } from "../../src/types/preferredContact.js";

type AvailabilityErrorResult = Extract<
  Awaited<ReturnType<typeof getPublicBookingAvailabilityData>>,
  { ok: false }
>;

type PackageLookupRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_preferred_contact_method: PreferredContactMethod | null;
  client_preferred_contact_value: string | null;
  code: string;
  package_title: string;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  sessions_count: number | string;
  status: string;
  used_sessions_count: number | string;
};

const PACKAGE_LOOKUP_RATE_LIMIT = {
  actionKey: "package_lookup",
  limit: 10,
  windowMs: 10 * 60 * 1000,
} as const;

const BOOKING_CREATE_RATE_LIMIT = {
  actionKey: "booking_create",
  limit: 5,
  windowMs: 10 * 60 * 1000,
} as const;

function isAvailabilityError(
  result: Awaited<ReturnType<typeof getPublicBookingAvailabilityData>>
): result is AvailabilityErrorResult {
  return result.ok === false;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePackageCode(value: string): string {
  return value.trim().toUpperCase();
}

function parsePackageLookupPayload(
  body: any
): PublicBookingPackageLookupPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const code = typeof rawBody?.code === "string" ? rawBody.code.trim() : "";
  const contact =
    typeof rawBody?.contact === "string" ? rawBody.contact.trim() : "";

  if (!code || !contact) {
    return null;
  }

  return {
    code,
    contact,
  };
}

function mapPackageLookup(row: PackageLookupRow): PublicBookingPackageInfo {
  const totalSessions = Number(row.sessions_count);
  const usedSessions = Number(row.used_sessions_count);
  const remainingSessions = Math.max(totalSessions - usedSessions, 0);

  return {
    clientPackageId: Number(row.id),
    clientId: Number(row.client_id),
    clientName: row.client_name,
    clientPhone: row.client_phone ?? "",
    clientEmail: row.client_email ?? "",
    preferredContactMethod: row.client_preferred_contact_method ?? "",
    preferredContactValue: row.client_preferred_contact_value ?? "",
    code: row.code,
    packageTitle: row.package_title,
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    serviceDurationMinutes: Number(row.service_duration_minutes),
    totalSessions,
    usedSessions,
    remainingSessions,
  };
}

async function ensureRateLimit(
  req: any,
  res: any,
  options: {
    actionKey: RateLimitActionKey;
    limit: number;
    windowMs: number;
  }
): Promise<boolean> {
  const result = await checkRateLimit({
    req,
    actionKey: options.actionKey,
    limit: options.limit,
    windowMs: options.windowMs,
  });

  if (!result.allowed) {
    sendRateLimitResponse(res, result);
    return false;
  }

  return true;
}

async function handleAvailability(req: any, res: any) {
  const rawServiceId = getSingleQueryValue(req.query?.serviceId).trim();
  const rawDate = getSingleQueryValue(req.query?.date).trim();
  const rawMonth = getSingleQueryValue(req.query?.month).trim();
  const selectedServiceId = rawServiceId ? Number(rawServiceId) : null;
  const selectedDate = rawDate || null;
  const visibleMonth = rawMonth || null;

  try {
    const result = await getPublicBookingAvailabilityData({
      serviceId: selectedServiceId,
      selectedDate,
      visibleMonth,
    });

    if (isAvailabilityError(result)) {
      if (result.reason === "invalid_service") {
        return res.status(400).json({ error: "Некорректная услуга" });
      }

      if (result.reason === "invalid_date") {
        return res.status(400).json({ error: "Некорректная дата" });
      }

      if (result.reason === "invalid_month") {
        return res.status(400).json({ error: "Некорректный месяц" });
      }

      if (result.reason === "service_not_found") {
        return res
          .status(404)
          .json({ error: "Услуга не найдена или отключена" });
      }

      return res
        .status(500)
        .json({ error: "Не удалось загрузить настройки записи" });
    }

    return res.status(200).json(result.payload);
  } catch (error) {
    console.error("Public booking availability error:", error);
    return res
      .status(500)
      .json({ error: "Не удалось загрузить доступные слоты" });
  }
}

async function handleLookupPackage(req: any, res: any) {
  const payload = parsePackageLookupPayload(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Укажите код пакета и телефон или email.",
      code: "invalid_payload",
    });
  }

  const normalizedCode = normalizePackageCode(payload.code);
  const normalizedPhone = normalizePhoneDigits(payload.contact);
  const normalizedEmail = payload.contact.trim().toLowerCase();

  try {
    const result = await pool.query<PackageLookupRow>(
      `
        SELECT
          csp.id,
          csp.client_id,
          c.name AS client_name,
          c.phone AS client_phone,
          c.email AS client_email,
          c.preferred_contact_method AS client_preferred_contact_method,
          c.preferred_contact_value AS client_preferred_contact_value,
          csp.code,
          spp.title AS package_title,
          spp.service_id,
          sv.title AS service_title,
          sv.duration_minutes AS service_duration_minutes,
          spp.sessions_count,
          csp.status,
          (
            SELECT COUNT(*)
            FROM sessions s
            WHERE s.client_package_id = csp.id
              AND s.status IN ('scheduled', 'completed', 'no_show')
          ) AS used_sessions_count
        FROM client_service_packages csp
        INNER JOIN clients c ON c.id = csp.client_id
        INNER JOIN service_package_plans spp ON spp.id = csp.package_plan_id
        INNER JOIN services sv ON sv.id = spp.service_id
        WHERE UPPER(csp.code) = $1
          AND csp.status = 'active'
          AND c.status = 'active'
          AND sv.is_active = TRUE
          AND (
            regexp_replace(COALESCE(c.phone, ''), '[^0-9]', '', 'g') = $2
            OR LOWER(COALESCE(c.email, '')) = $3
          )
        LIMIT 1
      `,
      [normalizedCode, normalizedPhone, normalizedEmail]
    );

    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({
        error:
          "Пакет не найден. Убедитесь, что вводите телефон или email, который связан с вашим кодом доступа к пакету.",
        code: "package_not_found",
      });
    }

    const packageInfo = mapPackageLookup(row);

    if (packageInfo.remainingSessions <= 0) {
      return res.status(409).json({
        error: "В этом пакете не осталось доступных сессий.",
        code: "package_unavailable",
      });
    }

    return res.status(200).json({
      success: true,
      package: packageInfo,
    });
  } catch (error) {
    console.error("Public package lookup error:", error);
    return res.status(500).json({
      error: "Не удалось проверить пакет. Попробуйте ещё раз позже.",
    });
  }
}

async function handleCreate(req: any, res: any) {
  const payload = parsePublicBookingCreatePayload(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для записи.",
      code: "invalid_payload",
    });
  }

  const validationError = getPublicBookingValidationError(payload);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
      code: "invalid_payload",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await createBookingService(client, payload);

    await client.query("COMMIT");

    void sendBookingNotificationsBounded(result.notificationPayload).catch(
      (error) => {
        console.error("Async booking notifications failed:", {
          sessionId: result.notificationPayload.sessionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    );

    return res.status(200).json(result.response);
  } catch (error) {
    await client.query("ROLLBACK");

    if (isCreateBookingServiceError(error)) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
      });
    }

    console.error("Public booking create error:", error);

    return res.status(500).json({
      error: "Не удалось создать запись",
      code: "booking_create_failed",
    });
  } finally {
    client.release();
  }
}

export default async function handler(req: any, res: any) {
  const action = getSingleQueryValue(req.query?.action).trim();

  if (req.method === "GET") {
    return handleAvailability(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (action === "lookup-package") {
    const isAllowed = await ensureRateLimit(
      req,
      res,
      PACKAGE_LOOKUP_RATE_LIMIT
    );

    if (!isAllowed) {
      return;
    }

    return handleLookupPackage(req, res);
  }

  if (action === "create") {
    const isAllowed = await ensureRateLimit(
      req,
      res,
      BOOKING_CREATE_RATE_LIMIT
    );

    if (!isAllowed) {
      return;
    }

    return handleCreate(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}