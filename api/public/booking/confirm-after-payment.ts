import { pool } from "../../../server/db/pool.js";
import {
  createBookingService,
  isCreateBookingServiceError,
} from "../../../server/services/createBookingService.js";
import { sendBookingNotificationsBounded } from "../../../server/publicBooking/sendBookingNotifications.js";
import {
  getPublicBookingValidationError,
  parsePublicBookingCreatePayload,
} from "../../../server/publicBooking/parsePublicBookingCreatePayload.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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