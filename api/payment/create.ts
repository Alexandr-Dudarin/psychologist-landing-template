import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../server/db/pool.js";
import { validateBookableSlot } from "../../server/publicBooking/bookingAvailability.js";
import {
  getPublicBookingValidationError,
  parsePublicBookingCreatePayload,
} from "../../server/publicBooking/parsePublicBookingCreatePayload.js";

type SlotValidationErrorResult = Extract<
  Awaited<ReturnType<typeof validateBookableSlot>>,
  { ok: false }
>;

function isSlotValidationError(
  result: Awaited<ReturnType<typeof validateBookableSlot>>
): result is SlotValidationErrorResult {
  return result.ok === false;
}

function mapSlotError(reason: SlotValidationErrorResult["reason"]) {
  if (reason === "invalid_service") {
    return {
      status: 400,
      error: "Услуга недоступна для онлайн-записи.",
      code: "invalid_service",
    };
  }

  if (reason === "invalid_date" || reason === "invalid_slot") {
    return {
      status: 400,
      error: "Некорректный слот для записи.",
      code: "invalid_slot",
    };
  }

  if (reason === "outside_booking_window") {
    return {
      status: 409,
      error: "Этот слот уже вне окна онлайн-записи. Пожалуйста, выберите другой.",
      code: "slot_unavailable",
    };
  }

  if (reason === "settings_missing") {
    return {
      status: 500,
      error: "Не удалось загрузить настройки записи.",
      code: "settings_missing",
    };
  }

  return {
    status: 409,
    error: "Выбранный слот уже недоступен. Пожалуйста, выберите другой.",
    code: "slot_unavailable",
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const rawRequestId =
    typeof req.body?.requestId === "string" ? req.body.requestId.trim() : "";

  if (!rawRequestId) {
    return res.status(400).json({
      message: "Missing requestId",
      code: "missing_request_id",
    });
  }

  const payload = parsePublicBookingCreatePayload(req.body);

  if (!payload) {
    return res.status(400).json({
      message: "Некорректные данные для записи.",
      code: "invalid_payload",
    });
  }

  const validationError = getPublicBookingValidationError(payload);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
      code: "invalid_payload",
    });
  }

  const client = await pool.connect();

  try {
    const slotValidation = await validateBookableSlot({
      serviceId: payload.serviceId,
      startsAt: payload.startsAt,
      db: client,
    });

    if (isSlotValidationError(slotValidation)) {
      const errorPayload = mapSlotError(slotValidation.reason);
      return res.status(errorPayload.status).json({
        message: errorPayload.error,
        code: errorPayload.code,
      });
    }

    const provider = "mock";
    const providerPaymentId = `mock_${rawRequestId}`;

    await client.query(
      `
        INSERT INTO payments (
          request_id,
          provider,
          provider_payment_id,
          status,
          amount,
          currency,
          booking_payload
        )
        VALUES ($1, $2, $3, 'pending', $4, 'RUB', $5)
        ON CONFLICT (request_id) DO NOTHING
      `,
      [
        rawRequestId,
        provider,
        providerPaymentId,
        slotValidation.service.price,
        payload,
      ]
    );

    return res.status(200).json({
      requestId: rawRequestId,
      confirmationUrl: `/payment-success?requestId=${encodeURIComponent(
        rawRequestId
      )}`,
    });
  } catch (error) {
    console.error("Payment create error:", error);

    return res.status(500).json({
      message: "Failed to create mock payment",
      code: "payment_create_failed",
    });
  } finally {
    client.release();
  }
}