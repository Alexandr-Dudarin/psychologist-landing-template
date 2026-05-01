import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../server/db/pool";

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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