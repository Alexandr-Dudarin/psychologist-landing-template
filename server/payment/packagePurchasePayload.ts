import { siteSettings } from "../../src/data/siteSettings.js";
import {
  normalizePreferredContactFields,
  validatePreferredContactFields,
} from "../../src/lib/preferredContact.js";
import {
  getContactNameValidationError,
  isValidContactEmail,
  normalizeContactNamePart,
  normalizeRussianPhoneForStorage,
} from "../../src/lib/contactValidation.js";
import type { PreferredContactMethod } from "../../src/types/preferredContact.js";

export type ServicePackagePurchasePayload = {
  packagePlanId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  preferredContactMethod?: PreferredContactMethod | "";
  preferredContactValue?: string;
  consent: boolean;
};

export function parseServicePackagePurchasePayload(
  body: any
): ServicePackagePurchasePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const packagePlanId = Number(rawBody?.packagePlanId);
  const firstName =
    typeof rawBody?.firstName === "string"
      ? normalizeContactNamePart(rawBody.firstName)
      : "";
  const lastName =
    typeof rawBody?.lastName === "string"
      ? normalizeContactNamePart(rawBody.lastName)
      : "";
  const rawPhone =
    typeof rawBody?.phone === "string" ? rawBody.phone.trim() : "";
  const phone = normalizeRussianPhoneForStorage(rawPhone) ?? rawPhone;
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const preferredContact = normalizePreferredContactFields(
    rawBody?.preferredContactMethod,
    rawBody?.preferredContactValue
  );
  const consent = rawBody?.consent === true;

  if (!Number.isInteger(packagePlanId) || packagePlanId <= 0) {
    return null;
  }

  if (!firstName || !lastName || !rawPhone || !email || !consent) {
    return null;
  }

  return {
    packagePlanId,
    firstName,
    lastName,
    phone,
    email,
    preferredContactMethod: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactMethod
      : "",
    preferredContactValue: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactValue
      : "",
    consent,
  };
}

export function getServicePackagePurchaseValidationError(
  payload: ServicePackagePurchasePayload
): string | null {
  if (!payload.firstName.trim()) {
    return "Введите имя.";
  }

  if (!payload.lastName.trim()) {
    return "Введите фамилию.";
  }

  const nameValidationError = getContactNameValidationError({
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
  });

  if (nameValidationError) {
    return nameValidationError;
  }

  if (!normalizeRussianPhoneForStorage(payload.phone)) {
    return "Введите корректный телефон.";
  }

  if (!isValidContactEmail(payload.email)) {
    return "Введите корректный email.";
  }

  if (!payload.consent) {
    return "Необходимо согласие на обработку персональных данных.";
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

export function parseStoredServicePackagePurchasePayload(
  value: unknown
): ServicePackagePurchasePayload | null {
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

  return parseServicePackagePurchasePayload(rawValue);
}