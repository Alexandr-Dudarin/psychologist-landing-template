/// <reference types="node" />

import type { PublicBookingCreatePayload } from "../../src/types/booking.js";
import { siteSettings } from "../../src/data/siteSettings.js";
import {
  normalizePreferredContactFields,
  validatePreferredContactFields,
} from "../../src/lib/preferredContact.js";

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
  const preferredContact = normalizePreferredContactFields(
    rawBody?.preferredContactMethod,
    rawBody?.preferredContactValue
  );
  const clientPackageCode =
    typeof rawBody?.clientPackageCode === "string"
      ? rawBody.clientPackageCode.trim()
      : "";
  const clientPackageContact =
    typeof rawBody?.clientPackageContact === "string"
      ? rawBody.clientPackageContact.trim()
      : "";
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
    preferredContactMethod: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactMethod
      : "",
    preferredContactValue: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactValue
      : "",
    clientPackageCode,
    clientPackageContact,
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

  if (payload.clientPackageCode?.trim()) {
    const packageContact =
      payload.clientPackageContact?.trim() ||
      payload.email.trim() ||
      payload.phone.trim();

    if (!packageContact) {
      return "Укажите телефон или email, чтобы проверить пакет.";
    }
  }

  const preferredContactErrors = validatePreferredContactFields(
    {
      preferredContactMethod: payload.preferredContactMethod ?? "",
      preferredContactValue: payload.preferredContactValue ?? "",
    },
    siteSettings.preferredContactMethod
  );

  if (
    preferredContactErrors.preferredContactMethod ||
    preferredContactErrors.preferredContactValue
  ) {
    return (
      preferredContactErrors.preferredContactMethod ??
      preferredContactErrors.preferredContactValue ??
      null
    );
  }

  return null;
}