/// <reference types="node" />

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