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

type AvailabilityErrorResult = Extract<
  Awaited<ReturnType<typeof getPublicBookingAvailabilityData>>,
  { ok: false }
>;

function isAvailabilityError(
  result: Awaited<ReturnType<typeof getPublicBookingAvailabilityData>>
): result is AvailabilityErrorResult {
  return result.ok === false;
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
        return res.status(404).json({ error: "Услуга не найдена или отключена" });
      }

      return res.status(500).json({ error: "Не удалось загрузить настройки записи" });
    }

    return res.status(200).json(result.payload);
  } catch (error) {
    console.error("Public booking availability error:", error);
    return res.status(500).json({ error: "Не удалось загрузить доступные слоты" });
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

    void sendBookingNotificationsBounded(result.notificationPayload).catch((error) => {
      console.error("Async booking notifications failed:", {
        sessionId: result.notificationPayload.sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });

    return res.status(200).json(result.response);
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (isCreateBookingServiceError(error)) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
      });
    }

    console.error("Public booking create error:", error);

    return res.status(500).json({
      error: "Не удалось создать запись. Попробуйте ещё раз позже.",
      code: "booking_create_failed",
    });
  } finally {
    client.release();
  }
}

async function handleConfirmAfterPayment(req: any, res: any) {
  const rawRequestId =
    typeof req.body?.requestId === "string" ? req.body.requestId.trim() : "";

  if (!rawRequestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }

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

    await client.query(
      `
        INSERT INTO booking_payment_requests (request_id)
        VALUES ($1)
      `,
      [rawRequestId]
    );

    const result = await createBookingService(client, payload);

    await client.query("COMMIT");

    void sendBookingNotificationsBounded(result.notificationPayload).catch((error) => {
      console.error("Async booking notifications failed:", {
        sessionId: result.notificationPayload.sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });

    return res.status(200).json({
      success: true,
      created: true,
      booking: result.response.booking,
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
      });
    }

    if (isCreateBookingServiceError(error)) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
      });
    }

    console.error("Confirm booking error:", error);

    return res.status(500).json({
      error: "Failed to confirm booking",
    });
  } finally {
    client.release();
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return handleAvailability(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = getSingleQueryValue(req.query?.action).trim();

  if (action === "create") {
    return handleCreate(req, res);
  }

  if (action === "confirm-after-payment") {
    return handleConfirmAfterPayment(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
