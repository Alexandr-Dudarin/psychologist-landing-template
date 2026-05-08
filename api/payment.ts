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

type StoredPaymentLookupRow = {
  request_id: string;
  status: string;
  provider_payment_id: string | null;
};

type YooKassaPaymentObject = {
  id: string;
  status: string;
  paid?: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
  metadata?: Record<string, unknown>;
  cancellation_details?: {
    reason?: string;
    party?: string;
  } | null;
};

type YooKassaNotificationBody = {
  type?: string;
  event?: string;
  object?: YooKassaPaymentObject;
};

class YooKassaApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "YooKassaApiError";
    this.status = status;
    this.code = code;
  }
}

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

function getHeaderValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getBaseUrl(req: VercelRequest): string {
  const forwardedProto = getHeaderValue(req.headers["x-forwarded-proto"]);
  const forwardedHost = getHeaderValue(req.headers["x-forwarded-host"]);
  const host = forwardedHost || getHeaderValue(req.headers.host);

  if (host) {
    return `${forwardedProto || "https"}://${host}`;
  }

  if (process.env.APP_BASE_URL?.trim()) {
    return process.env.APP_BASE_URL.trim().replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

function getYooKassaShopId(): string {
  const value = process.env.YOOKASSA_SHOP_ID?.trim();

  if (!value) {
    throw new YooKassaApiError(
      500,
      "missing_yookassa_shop_id",
      "Не задан YOOKASSA_SHOP_ID."
    );
  }

  return value;
}

function getYooKassaSecretKey(): string {
  const value = process.env.YOOKASSA_SECRET_KEY?.trim();

  if (!value) {
    throw new YooKassaApiError(
      500,
      "missing_yookassa_secret_key",
      "Не задан YOOKASSA_SECRET_KEY."
    );
  }

  return value;
}

function getYooKassaAuthHeader(): string {
  const credentials = `${getYooKassaShopId()}:${getYooKassaSecretKey()}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function formatPaymentAmount(value: string | number): string {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new YooKassaApiError(
      500,
      "invalid_payment_amount",
      "Некорректная сумма платежа."
    );
  }

  return numericValue.toFixed(2);
}

function mapProviderStatusToDbStatus(status: string): string {
  if (status === "succeeded") {
    return "paid";
  }

  if (status === "canceled") {
    return "cancelled";
  }

  return "pending";
}

function mapDbStatusToPublicStatus(
  status: string
): "pending" | "paid" | "failed" | "expired" | "cancelled" {
  if (status === "paid") {
    return "paid";
  }

  if (status === "failed") {
    return "failed";
  }

  if (status === "expired") {
    return "expired";
  }

  if (status === "cancelled" || status === "canceled") {
    return "cancelled";
  }

  return "pending";
}

async function parseYooKassaError(response: Response) {
  const fallbackMessage = "Ошибка при обращении к ЮKassa.";

  try {
    const data = (await response.json()) as {
      description?: string;
      code?: string;
    };

    return {
      message: data.description || fallbackMessage,
      code: data.code || "yookassa_api_error",
    };
  } catch {
    return {
      message: fallbackMessage,
      code: "yookassa_api_error",
    };
  }
}

async function createYooKassaPayment(params: {
  requestId: string;
  amount: string;
  returnUrl: string;
  description: string;
}): Promise<YooKassaPaymentObject> {
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: getYooKassaAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": params.requestId,
    },
    body: JSON.stringify({
      amount: {
        value: params.amount,
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: params.returnUrl,
      },
      description: params.description,
      metadata: {
        request_id: params.requestId,
      },
    }),
  });

  if (!response.ok) {
    const parsedError = await parseYooKassaError(response);

    throw new YooKassaApiError(
      502,
      parsedError.code,
      parsedError.message || "Не удалось создать платёж в ЮKassa."
    );
  }

  return (await response.json()) as YooKassaPaymentObject;
}

async function getYooKassaPayment(
  paymentId: string
): Promise<YooKassaPaymentObject> {
  const response = await fetch(
    `https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: getYooKassaAuthHeader(),
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const parsedError = await parseYooKassaError(response);

    throw new YooKassaApiError(
      502,
      parsedError.code,
      parsedError.message || "Не удалось получить статус платежа в ЮKassa."
    );
  }

  return (await response.json()) as YooKassaPaymentObject;
}

function parseWebhookBody(body: unknown): YooKassaNotificationBody | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  if (!rawBody || typeof rawBody !== "object") {
    return null;
  }

  return rawBody as YooKassaNotificationBody;
}

async function findStoredPaymentByProviderId(
  providerPaymentId: string,
  requestIdFromMetadata?: string
): Promise<StoredPaymentLookupRow | null> {
  if (requestIdFromMetadata?.trim()) {
    const byProviderAndRequest = await pool.query<StoredPaymentLookupRow>(
      `
        SELECT
          request_id,
          status,
          provider_payment_id
        FROM payments
        WHERE provider_payment_id = $1 OR request_id = $2
        ORDER BY paid_at DESC NULLS LAST
        LIMIT 1
      `,
      [providerPaymentId, requestIdFromMetadata.trim()]
    );

    return byProviderAndRequest.rows[0] ?? null;
  }

  const byProvider = await pool.query<StoredPaymentLookupRow>(
    `
      SELECT
        request_id,
        status,
        provider_payment_id
      FROM payments
      WHERE provider_payment_id = $1
      LIMIT 1
    `,
    [providerPaymentId]
  );

  return byProvider.rows[0] ?? null;
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

    const returnUrl = `${getBaseUrl(req)}/payment-success?requestId=${encodeURIComponent(
      rawRequestId
    )}`;

    const payment = await createYooKassaPayment({
      requestId: rawRequestId,
      amount: formatPaymentAmount(slotValidation.service.price),
      returnUrl,
      description: `Онлайн-запись #${rawRequestId}`,
    });

    const confirmationUrl = payment.confirmation?.confirmation_url?.trim();

    if (!confirmationUrl) {
      throw new YooKassaApiError(
        502,
        "missing_confirmation_url",
        "ЮKassa не вернула ссылку для подтверждения оплаты."
      );
    }

    await client.query(
      `
        INSERT INTO payments (
          request_id,
          provider,
          provider_payment_id,
          status,
          amount,
          currency,
          booking_payload,
          error_message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
        ON CONFLICT (request_id)
        DO UPDATE SET
          provider = EXCLUDED.provider,
          provider_payment_id = EXCLUDED.provider_payment_id,
          status = EXCLUDED.status,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          booking_payload = EXCLUDED.booking_payload,
          error_message = NULL,
          updated_at = NOW()
      `,
      [
        rawRequestId,
        "yookassa",
        payment.id,
        mapProviderStatusToDbStatus(payment.status),
        Number(payment.amount.value),
        payment.amount.currency,
        payload,
      ]
    );

    return res.status(200).json({
      requestId: rawRequestId,
      confirmationUrl,
    });
  } catch (error) {
    if (error instanceof YooKassaApiError) {
      return res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error("Payment create error:", error);

    return res.status(500).json({
      message: "Не удалось создать платёж.",
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
      status: mapDbStatusToPublicStatus(payment.status),
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

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  const notification = parseWebhookBody(req.body);

  if (!notification?.event || !notification.object?.id) {
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    const actualPayment = await getYooKassaPayment(notification.object.id);

    const requestIdFromMetadata =
      typeof actualPayment.metadata?.request_id === "string"
        ? actualPayment.metadata.request_id
        : undefined;

    const storedPayment = await findStoredPaymentByProviderId(
      actualPayment.id,
      requestIdFromMetadata
    );

    if (!storedPayment) {
      console.warn("YooKassa webhook: payment not found in local DB", {
        providerPaymentId: actualPayment.id,
        event: notification.event,
      });

      return res.status(200).json({ received: true, ignored: true });
    }

    if (actualPayment.status === "succeeded") {
      if (storedPayment.status === "paid") {
        return res.status(200).json({ received: true, alreadyPaid: true });
      }

      await finalizeMockPayment(storedPayment.request_id);

      return res.status(200).json({ received: true, finalized: true });
    }

    if (actualPayment.status === "canceled") {
      const cancellationReason = actualPayment.cancellation_details?.reason
        ? `Оплата отменена: ${actualPayment.cancellation_details.reason}`
        : "Оплата отменена.";

      await pool.query(
        `
          UPDATE payments
          SET
            status = 'cancelled',
            error_message = $2,
            updated_at = NOW()
          WHERE request_id = $1
        `,
        [storedPayment.request_id, cancellationReason]
      );

      return res.status(200).json({ received: true, cancelled: true });
    }

    await pool.query(
      `
        UPDATE payments
        SET
          status = $2,
          updated_at = NOW()
        WHERE request_id = $1
      `,
      [storedPayment.request_id, mapProviderStatusToDbStatus(actualPayment.status)]
    );

    return res.status(200).json({ received: true, ignored: true });
  } catch (error) {
    if (error instanceof YooKassaApiError) {
      console.error("YooKassa webhook verification error:", error);
      return res.status(500).json({
        message: error.message,
        code: error.code,
      });
    }

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

    console.error("YooKassa webhook handler error:", error);

    return res.status(500).json({
      message: "Failed to process webhook",
      code: "payment_webhook_failed",
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

  if (req.method === "POST" && action === "webhook") {
    return handleWebhook(req, res);
  }

  if (req.method === "POST" && action === "mock-complete") {
    return handleMockComplete(req, res);
  }

  return res.status(405).json({ message: "Method not allowed" });
}