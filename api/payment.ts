import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  validateBookableSlot,
  getSingleQueryValue,
} from "../server/publicBooking/bookingAvailability.js";
import {
  getPublicBookingValidationError,
  parsePublicBookingCreatePayload,
} from "../server/publicBooking/parsePublicBookingCreatePayload.js";
import {
  finalizeMockPayment,
  isPaymentFlowError,
} from "../server/payment/finalizeMockPayment.js";
import { pool } from "../server/db/pool.js";
import { isCreateBookingServiceError } from "../server/services/createBookingService.js";

type SlotValidationErrorResult = Extract<
  Awaited<ReturnType<typeof validateBookableSlot>>,
  { ok: false }
>;

type PaymentRow = {
  request_id: string;
  status: string;
  amount: string | number;
  currency: string;
  session_id: string | number | null;
  error_message: string | null;
  paid_at: string | null;
  booking_payload: unknown;
};

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
      error:
        "Этот слот уже вне окна онлайн-записи. Пожалуйста, выберите другой.",
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

function parseStoredBookingPayload(value: unknown) {
  let rawValue = value;

  if (typeof rawValue === "string") {
    try {
      rawValue = JSON.parse(rawValue);
    } catch {
      return null;
    }
  }

  if (!rawValue || typeof rawValue !== "object") {
    return null;
  }

  return rawValue as Record<string, unknown>;
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
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

async function handleStatus(req: VercelRequest, res: VercelResponse) {
  const requestId =
    typeof req.query.requestId === "string" ? req.query.requestId.trim() : "";

  if (!requestId) {
    return res.status(400).json({
      message: "Missing requestId",
      code: "missing_request_id",
    });
  }

  try {
    const result = await pool.query<PaymentRow>(
      `
        SELECT
          request_id,
          status,
          amount,
          currency,
          session_id,
          error_message,
          paid_at,
          booking_payload
        FROM payments
        WHERE request_id = $1
        LIMIT 1
      `,
      [requestId]
    );

    const payment = result.rows[0];

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
        code: "payment_not_found",
      });
    }

    const bookingPayload = parseStoredBookingPayload(payment.booking_payload);

    return res.status(200).json({
      requestId: payment.request_id,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      sessionId: payment.session_id ? Number(payment.session_id) : null,
      errorMessage: payment.error_message,
      paidAt: payment.paid_at,
      booking: {
        startsAt:
          typeof bookingPayload?.startsAt === "string"
            ? bookingPayload.startsAt
            : "",
        firstName:
          typeof bookingPayload?.firstName === "string"
            ? bookingPayload.firstName
            : "",
        lastName:
          typeof bookingPayload?.lastName === "string"
            ? bookingPayload.lastName
            : "",
        email:
          typeof bookingPayload?.email === "string"
            ? bookingPayload.email
            : "",
      },
    });
  } catch (error) {
    console.error("Payment status error:", error);

    return res.status(500).json({
      message: "Failed to load payment status",
      code: "payment_status_failed",
    });
  }
}

async function handleMockComplete(req: VercelRequest, res: VercelResponse) {
  const requestId =
    typeof req.body?.requestId === "string" ? req.body.requestId.trim() : "";

  if (!requestId) {
    return res.status(400).json({
      message: "Missing requestId",
      code: "missing_request_id",
    });
  }

  try {
    const result = await finalizeMockPayment(requestId);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (isCreateBookingServiceError(error)) {
      return res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
    }

    if (isPaymentFlowError(error)) {
      return res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error("Mock payment complete handler error:", error);

    return res.status(500).json({
      message: "Failed to complete mock payment",
      code: "mock_payment_complete_failed",
    });
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const action = getSingleQueryValue(req.query?.action).trim();

  if (req.method === "POST" && action === "create") {
    return handleCreate(req, res);
  }

  if (req.method === "GET" && action === "status") {
    return handleStatus(req, res);
  }

  if (req.method === "POST" && action === "mock-complete") {
    return handleMockComplete(req, res);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
