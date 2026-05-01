/// <reference types="node" />

import type { PublicBookingCreatePayload } from "../../src/types/booking";

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function parsePublicBookingCreatePayload(
  body: any
): PublicBookingCreatePayload | null {
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

export function getPublicBookingValidationError(
  payload: PublicBookingCreatePayload
): string | null {
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