/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import { createBookingService } from "../../../server/services/createBookingService";
import type {
  PublicBookingCreatePayload,
} from "../../../src/types/booking";

type ParsedPayload = PublicBookingCreatePayload;

function parseBody(body: any): ParsedPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const serviceId = Number(rawBody?.serviceId);
  const startsAt =
    typeof rawBody?.startsAt === "string" ? rawBody.startsAt.trim() : "";
  const firstName =
    typeof rawBody?.firstName === "string" ? rawBody.firstName.trim() : "";
  const lastName =
    typeof rawBody?.lastName === "string" ? rawBody.lastName.trim() : "";
  const phone = typeof rawBody?.phone === "string" ? rawBody.phone.trim() : "";
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const message =
    typeof rawBody?.message === "string" ? rawBody.message.trim() : "";
  const consent = rawBody?.consent === true;

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
    consent,
  };
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

function getValidationError(payload: ParsedPayload): string | null {
  if (!payload.firstName.trim()) {
    return "Введите имя.";
  }

  if (!payload.lastName.trim()) {
    return "Введите фамилию.";
  }

  if (normalizePhoneDigits(payload.phone).length < 10) {
    return "Введите корректный телефон.";
  }

  if (!isValidEmail(payload.email)) {
    return "Введите корректный email.";
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для записи.",
      code: "invalid_payload",
    });
  }

  const validationError = getValidationError(payload);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
      code: "invalid_payload",
    });
  }

  const client = await pool.connect();

  try {
    const result = await createBookingService(client, payload);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Public booking create error:", error);

    return res.status(500).json({
      error: "Не удалось создать запись. Попробуйте ещё раз позже.",
      code: "booking_create_failed",
    });
  } finally {
    client.release();
  }
}