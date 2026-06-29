import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";
import {
  validateBookableSlot,
  getSingleQueryValue,
} from "../server/publicBooking/bookingAvailability.js";
import {
  getPublicBookingValidationError,
  parsePublicBookingCreatePayload,
} from "../server/publicBooking/parsePublicBookingCreatePayload.js";
import {
  finalizeSuccessfulPayment,
  isPaymentFlowError,
} from "../server/payment/finalizeSuccessfulPayment.js";
import {
  getServicePackagePurchaseValidationError,
  parseServicePackagePurchasePayload,
} from "../server/payment/packagePurchasePayload.js";
import { pool } from "../server/db/pool.js";
import { isCreateBookingServiceError } from "../server/services/createBookingService.js";
import { getBookingSettingsTimezone } from "../server/utils/getBookingSettingsTimezone.js";
import {
  checkRateLimit,
  sendRateLimitResponse,
  type RateLimitActionKey,
} from "../server/utils/rateLimit.js";

type PaymentKind = "booking" | "service_package";

type SlotValidationErrorResult = Extract<
  Awaited<ReturnType<typeof validateBookableSlot>>,
  { ok: false }
>;

type PaymentRow = {
  request_id: string;
  payment_kind: string;
  status: string;
  provider_payment_id: string | null;
  amount: string | number;
  currency: string;
  session_id: string | number | null;
  client_package_id: string | number | null;
  error_message: string | null;
  paid_at: string | null;
  booking_payload: unknown;
  package_purchase_payload: unknown;
};

type StoredPaymentLookupRow = {
  request_id: string;
  status: string;
  provider_payment_id: string | null;
};

type ServicePackagePlanPaymentRow = {
  id: string | number;
  title: string;
  sessions_count: string | number;
  price: string | number;
  is_active: boolean;
  service_title: string;
  service_is_active: boolean;
};

type ClientPackageStatusRow = {
  code: string;
  package_title: string;
  service_title: string;
  sessions_count: string | number;
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

const YOOKASSA_WEBHOOK_IPV4_RANGES = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11",
  "77.75.156.35",
  "77.75.154.128/25",
] as const;

const YOOKASSA_WEBHOOK_IPV6_PREFIX = "2a02:5180::/32";

const PAYMENT_CREATE_RATE_LIMIT = {
  actionKey: "payment_create",
  limit: 5,
  windowMs: 10 * 60 * 1000,
} as const;

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

function getPaymentKind(body: any): PaymentKind {
  return body?.paymentKind === "service_package" ? "service_package" : "booking";
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

function parseStoredJson(value: unknown) {
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

async function ensureRateLimit(
  req: VercelRequest,
  res: VercelResponse,
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

function normalizeRequestIp(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("[") && trimmedValue.includes("]")) {
    return trimmedValue.slice(1, trimmedValue.indexOf("]")).trim();
  }

  const ipv4WithPort = trimmedValue.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);

  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  return trimmedValue;
}

export function getRequestIp(req: VercelRequest): string | null {
  const headerNames = [
    "x-forwarded-for",
    "x-vercel-forwarded-for",
    "x-real-ip",
    "true-client-ip",
  ] as const;

  for (const headerName of headerNames) {
    const headerValue = getHeaderValue(req.headers[headerName]);

    if (!headerValue?.trim()) {
      continue;
    }

    const firstIp = headerValue.split(",")[0]?.trim();

    if (firstIp) {
      return normalizeRequestIp(firstIp);
    }
  }

  return null;
}

function ipv4ToUint(ip: string): number | null {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  let result = 0;

  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }

    const octet = Number(part);

    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }

    result = (result << 8) + octet;
  }

  return result >>> 0;
}

function isIpv4InRange(ip: string, range: string): boolean {
  if (!range.includes("/")) {
    return ip === range;
  }

  const [baseIp, prefixLengthRaw] = range.split("/");
  const prefixLength = Number(prefixLengthRaw);
  const ipValue = ipv4ToUint(ip);
  const baseValue = ipv4ToUint(baseIp);

  if (
    ipValue === null ||
    baseValue === null ||
    !Number.isInteger(prefixLength) ||
    prefixLength < 0 ||
    prefixLength > 32
  ) {
    return false;
  }

  const mask =
    prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0;

  return (ipValue & mask) === (baseValue & mask);
}

function expandIpv6(ip: string): number[] | null {
  const normalizedIp = ip.toLowerCase();

  if (!/^[0-9a-f:]+$/.test(normalizedIp)) {
    return null;
  }

  const doubleColonParts = normalizedIp.split("::");

  if (doubleColonParts.length > 2) {
    return null;
  }

  const leftParts = doubleColonParts[0]
    ? doubleColonParts[0].split(":").filter(Boolean)
    : [];
  const rightParts = doubleColonParts[1]
    ? doubleColonParts[1].split(":").filter(Boolean)
    : [];
  const missingParts =
    doubleColonParts.length === 2 ? 8 - leftParts.length - rightParts.length : 0;
  const parts =
    doubleColonParts.length === 2
      ? [...leftParts, ...Array(Math.max(missingParts, 0)).fill("0"), ...rightParts]
      : leftParts;

  if (parts.length !== 8 || missingParts < 0) {
    return null;
  }

  const hextets = parts.map((part) => {
    if (!/^[0-9a-f]{1,4}$/.test(part)) {
      return null;
    }

    return Number.parseInt(part, 16);
  });

  if (hextets.some((part) => part === null)) {
    return null;
  }

  return hextets as number[];
}

function isIpv6InYooKassaPrefix(ip: string): boolean {
  const hextets = expandIpv6(ip);
  const [prefixIp, prefixLengthRaw] = YOOKASSA_WEBHOOK_IPV6_PREFIX.split("/");
  const prefixHextets = expandIpv6(prefixIp);
  const prefixLength = Number(prefixLengthRaw);

  if (!hextets || !prefixHextets || prefixLength !== 32) {
    return false;
  }

  return hextets[0] === prefixHextets[0] && hextets[1] === prefixHextets[1];
}

export function isIpInYooKassaWebhookAllowlist(ip: string): boolean {
  const normalizedIp = normalizeRequestIp(ip);

  if (!normalizedIp) {
    return false;
  }

  if (ipv4ToUint(normalizedIp) !== null) {
    return YOOKASSA_WEBHOOK_IPV4_RANGES.some((range) =>
      isIpv4InRange(normalizedIp, range)
    );
  }

  return isIpv6InYooKassaPrefix(normalizedIp);
}

function safeCompareStrings(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function isYooKassaWebhookSecretValid(req: VercelRequest): boolean {
  const expectedSecret = process.env.YOOKASSA_WEBHOOK_SECRET?.trim();

  if (!expectedSecret) {
    return true;
  }

  const querySecret = getSingleQueryValue(
    req.query?.secret as string | string[] | undefined
  ).trim();
  const headerSecret =
    getHeaderValue(req.headers["x-webhook-secret"])?.trim() ?? "";

  return (
    safeCompareStrings(querySecret, expectedSecret) ||
    safeCompareStrings(headerSecret, expectedSecret)
  );
}

export function isYooKassaWebhookRequestAllowed(req: VercelRequest): boolean {
  const requestIp = getRequestIp(req);

  return Boolean(requestIp && isIpInYooKassaWebhookAllowlist(requestIp));
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
  paymentKind: PaymentKind;
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
        payment_kind: params.paymentKind,
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

async function selectPackagePlanForPayment(packagePlanId: number) {
  const result = await pool.query<ServicePackagePlanPaymentRow>(
    `
      SELECT
        p.id,
        p.title,
        p.sessions_count,
        p.price,
        p.is_active,
        s.title AS service_title,
        s.is_active AS service_is_active
      FROM service_package_plans p
      INNER JOIN services s ON s.id = p.service_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [packagePlanId]
  );

  const packagePlan = result.rows[0];

  if (!packagePlan) {
    throw new YooKassaApiError(
      404,
      "package_plan_not_found",
      "Пакет услуг не найден."
    );
  }

  if (!packagePlan.is_active || !packagePlan.service_is_active) {
    throw new YooKassaApiError(
      409,
      "package_plan_inactive",
      "Этот пакет услуг сейчас недоступен для покупки."
    );
  }

  return packagePlan;
}

async function getClientPackageStatusInfo(clientPackageId: number) {
  const result = await pool.query<ClientPackageStatusRow>(
    `
      SELECT
        csp.code,
        spp.title AS package_title,
        s.title AS service_title,
        spp.sessions_count
      FROM client_service_packages csp
      INNER JOIN service_package_plans spp ON spp.id = csp.package_plan_id
      INNER JOIN services s ON s.id = spp.service_id
      WHERE csp.id = $1
      LIMIT 1
    `,
    [clientPackageId]
  );

  return result.rows[0] ?? null;
}

async function insertPayment(params: {
  requestId: string;
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentKind: PaymentKind;
  bookingPayload: unknown | null;
  packagePurchasePayload: unknown | null;
}) {
  await pool.query(
    `
      INSERT INTO payments (
        request_id,
        provider,
        provider_payment_id,
        status,
        amount,
        currency,
        payment_kind,
        booking_payload,
        package_purchase_payload,
        session_id,
        client_package_id,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL, NULL)
      ON CONFLICT (request_id)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        provider_payment_id = EXCLUDED.provider_payment_id,
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        payment_kind = EXCLUDED.payment_kind,
        booking_payload = EXCLUDED.booking_payload,
        package_purchase_payload = EXCLUDED.package_purchase_payload,
        session_id = NULL,
        client_package_id = NULL,
        error_message = NULL,
        updated_at = NOW()
    `,
    [
      params.requestId,
      "yookassa",
      params.providerPaymentId,
      params.status,
      params.amount,
      params.currency,
      params.paymentKind,
      params.bookingPayload,
      params.packagePurchasePayload,
    ]
  );
}

async function handleCreateBookingPayment(
  req: VercelRequest,
  res: VercelResponse,
  rawRequestId: string
) {
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
      paymentKind: "booking",
    });

    const confirmationUrl = payment.confirmation?.confirmation_url?.trim();

    if (!confirmationUrl) {
      throw new YooKassaApiError(
        502,
        "missing_confirmation_url",
        "ЮKassa не вернула ссылку для подтверждения оплаты."
      );
    }

    await insertPayment({
      requestId: rawRequestId,
      providerPaymentId: payment.id,
      status: mapProviderStatusToDbStatus(payment.status),
      amount: Number(payment.amount.value),
      currency: payment.amount.currency,
      paymentKind: "booking",
      bookingPayload: payload,
      packagePurchasePayload: null,
    });

    return res.status(200).json({
      requestId: rawRequestId,
      confirmationUrl,
    });
  } finally {
    client.release();
  }
}

async function handleCreateServicePackagePayment(
  req: VercelRequest,
  res: VercelResponse,
  rawRequestId: string
) {
  const payload = parseServicePackagePurchasePayload(req.body);

  if (!payload) {
    return res.status(400).json({
      message: "Некорректные данные для покупки пакета.",
      code: "invalid_package_purchase_payload",
    });
  }

  const validationError = getServicePackagePurchaseValidationError(payload);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
      code: "invalid_package_purchase_payload",
    });
  }

  const packagePlan = await selectPackagePlanForPayment(payload.packagePlanId);

  const returnUrl = `${getBaseUrl(req)}/payment-success?requestId=${encodeURIComponent(
    rawRequestId
  )}`;

  const payment = await createYooKassaPayment({
    requestId: rawRequestId,
    amount: formatPaymentAmount(packagePlan.price),
    returnUrl,
    description: `Пакет услуг: ${packagePlan.title}`,
    paymentKind: "service_package",
  });

  const confirmationUrl = payment.confirmation?.confirmation_url?.trim();

  if (!confirmationUrl) {
    throw new YooKassaApiError(
      502,
      "missing_confirmation_url",
      "ЮKassa не вернула ссылку для подтверждения оплаты."
    );
  }

  await insertPayment({
    requestId: rawRequestId,
    providerPaymentId: payment.id,
    status: mapProviderStatusToDbStatus(payment.status),
    amount: Number(payment.amount.value),
    currency: payment.amount.currency,
    paymentKind: "service_package",
    bookingPayload: null,
    packagePurchasePayload: payload,
  });

  return res.status(200).json({
    requestId: rawRequestId,
    confirmationUrl,
  });
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

  try {
    const paymentKind = getPaymentKind(req.body);

    if (paymentKind === "service_package") {
      return await handleCreateServicePackagePayment(req, res, rawRequestId);
    }

    return await handleCreateBookingPayment(req, res, rawRequestId);
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
  }
}

async function loadPaymentRow(requestId: string): Promise<PaymentRow | null> {
  const result = await pool.query<PaymentRow>(
    `
      SELECT
        request_id,
        payment_kind,
        status,
        provider_payment_id,
        amount,
        currency,
        session_id,
        client_package_id,
        error_message,
        paid_at,
        booking_payload,
        package_purchase_payload
      FROM payments
      WHERE request_id = $1
      LIMIT 1
    `,
    [requestId]
  );

  return result.rows[0] ?? null;
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
    let payment = await loadPaymentRow(requestId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
        code: "payment_not_found",
      });
    }

    if (payment.status === "pending" && payment.provider_payment_id) {
      try {
        const providerPayment = await getYooKassaPayment(
          payment.provider_payment_id
        );

        if (providerPayment.status === "succeeded") {
          await finalizeSuccessfulPayment(payment.request_id);
        } else if (providerPayment.status === "canceled") {
          const cancellationReason = providerPayment.cancellation_details?.reason
            ? `Оплата отменена: ${providerPayment.cancellation_details.reason}`
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
            [payment.request_id, cancellationReason]
          );
        }

        const refreshedPayment = await loadPaymentRow(requestId);

        if (!refreshedPayment) {
          return res.status(404).json({
            message: "Payment not found",
            code: "payment_not_found",
          });
        }

        payment = refreshedPayment;
      } catch (providerStatusError) {
        console.error("Payment status verification error:", providerStatusError);
      }
    }

    const currentPayment = payment;

    const bookingPayload = parseStoredJson(currentPayment.booking_payload);
    const packagePurchasePayload = parseStoredJson(
      currentPayment.package_purchase_payload
    );
    const timezone = await getBookingSettingsTimezone(pool);
    const clientPackageId = currentPayment.client_package_id
      ? Number(currentPayment.client_package_id)
      : null;
    const clientPackageInfo = clientPackageId
      ? await getClientPackageStatusInfo(clientPackageId)
      : null;

    return res.status(200).json({
      requestId: currentPayment.request_id,
      paymentKind: getPaymentKind({
        paymentKind: currentPayment.payment_kind,
      }),
      status: mapDbStatusToPublicStatus(currentPayment.status),
      amount: Number(currentPayment.amount),
      currency: currentPayment.currency,
      sessionId: currentPayment.session_id
        ? Number(currentPayment.session_id)
        : null,
      clientPackageId,
      errorMessage: currentPayment.error_message,
      paidAt: currentPayment.paid_at,
      timezone,
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
      servicePackage: packagePurchasePayload
        ? {
          packagePlanId:
            typeof packagePurchasePayload.packagePlanId === "number"
              ? packagePurchasePayload.packagePlanId
              : Number(packagePurchasePayload.packagePlanId) || null,
          packageTitle: clientPackageInfo?.package_title ?? "",
          serviceTitle: clientPackageInfo?.service_title ?? "",
          sessionsCount: clientPackageInfo
            ? Number(clientPackageInfo.sessions_count)
            : null,
          code: clientPackageInfo?.code ?? "",
          firstName:
            typeof packagePurchasePayload.firstName === "string"
              ? packagePurchasePayload.firstName
              : "",
          lastName:
            typeof packagePurchasePayload.lastName === "string"
              ? packagePurchasePayload.lastName
              : "",
          email:
            typeof packagePurchasePayload.email === "string"
              ? packagePurchasePayload.email
              : "",
        }
        : null,
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
  if (!isYooKassaWebhookSecretValid(req)) {
    return res.status(401).json({
      message: "Unauthorized webhook",
      code: "invalid_webhook_secret",
    });
  }

  if (!isYooKassaWebhookRequestAllowed(req)) {
    return res.status(403).json({
      message: "Webhook source IP is not allowed",
      code: "webhook_ip_not_allowed",
    });
  }

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

      await finalizeSuccessfulPayment(storedPayment.request_id);

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
      [
        storedPayment.request_id,
        mapProviderStatusToDbStatus(actualPayment.status),
      ]
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const action = getSingleQueryValue(req.query?.action).trim();

  if (req.method === "POST" && action === "create") {
    const isAllowed = await ensureRateLimit(
      req,
      res,
      PAYMENT_CREATE_RATE_LIMIT
    );

    if (!isAllowed) {
      return;
    }

    return handleCreate(req, res);
  }

  if (req.method === "GET" && action === "status") {
    return handleStatus(req, res);
  }

  if (req.method === "POST" && action === "webhook") {
    return handleWebhook(req, res);
  }

  return res.status(405).json({ message: "Method not allowed" });
}