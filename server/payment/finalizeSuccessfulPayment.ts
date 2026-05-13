import { pool } from "../db/pool.js";
import { sendBookingNotificationsBounded } from "../publicBooking/sendBookingNotifications.js";
import {
  createBookingService,
  isCreateBookingServiceError,
} from "../services/createBookingService.js";
import type { PublicBookingCreatePayload } from "../../src/types/booking.js";
import { siteSettings } from "../../src/data/siteSettings.js";
import { normalizePreferredContactFields } from "../../src/lib/preferredContact.js";

type PaymentRow = {
  id: number | string;
  request_id: string;
  status: string;
  booking_payload: unknown;
  session_id: number | string | null;
};

export class PaymentFlowError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PaymentFlowError";
    this.status = status;
    this.code = code;
  }
}

export function isPaymentFlowError(error: unknown): error is PaymentFlowError {
  return error instanceof PaymentFlowError;
}

function parseStoredBookingPayload(
  value: unknown
): PublicBookingCreatePayload | null {
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

  const raw = rawValue as Record<string, unknown>;

  const serviceId = Number(raw.serviceId);
  const startsAt = typeof raw.startsAt === "string" ? raw.startsAt.trim() : "";
  const firstName =
    typeof raw.firstName === "string" ? raw.firstName.trim() : "";
  const lastName =
    typeof raw.lastName === "string" ? raw.lastName.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const preferredContact = normalizePreferredContactFields(
    raw.preferredContactMethod,
    raw.preferredContactValue
  );
  const consent = raw.consent === true;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  if (!startsAt || !firstName || !lastName || !phone || !email || !consent) {
    return null;
  }

  return {
    serviceId,
    startsAt,
    firstName,
    lastName,
    phone,
    email,
    message,
    preferredContactMethod: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactMethod
      : "",
    preferredContactValue: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactValue
      : "",
    consent,
  };
}

export async function finalizeSuccessfulPayment(requestId: string): Promise<{
  success: true;
  alreadyPaid?: true;
}> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const paymentResult = await client.query<PaymentRow>(
      `
        SELECT
          id,
          request_id,
          status,
          booking_payload,
          session_id
        FROM payments
        WHERE request_id = $1
        FOR UPDATE
      `,
      [requestId]
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new PaymentFlowError(404, "payment_not_found", "Платёж не найден.");
    }

    if (payment.status === "paid") {
      await client.query("COMMIT");

      return {
        success: true,
        alreadyPaid: true,
      };
    }

    if (payment.status !== "pending") {
      throw new PaymentFlowError(
        409,
        "invalid_payment_state",
        "Оплата не находится в ожидающем состоянии."
      );
    }

    const payload = parseStoredBookingPayload(payment.booking_payload);

    if (!payload) {
      throw new PaymentFlowError(
        500,
        "invalid_payment_payload",
        "Не удалось восстановить данные оплаты."
      );
    }

    const result = await createBookingService(client, payload);

    await client.query(
      `
        UPDATE payments
        SET
          status = 'paid',
          session_id = $2,
          paid_at = NOW(),
          updated_at = NOW(),
          error_message = NULL
        WHERE id = $1
      `,
      [payment.id, result.response.booking.sessionId]
    );

    await client.query("COMMIT");

    void sendBookingNotificationsBounded(result.notificationPayload).catch(
      (error) => {
        console.error("Async payment notifications failed:", {
          sessionId: result.notificationPayload.sessionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    );

    return {
      success: true,
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (isCreateBookingServiceError(error)) {
      await pool
        .query(
          `
            UPDATE payments
            SET
              error_message = $2,
              updated_at = NOW()
            WHERE request_id = $1
          `,
          [requestId, error.message]
        )
        .catch(() => undefined);

      throw error;
    }

    if (isPaymentFlowError(error)) {
      throw error;
    }

    console.error("Payment finalize error:", error);

    throw new PaymentFlowError(
      500,
      "payment_finalize_failed",
      "Не удалось завершить оплату."
    );
  } finally {
    client.release();
  }
}
