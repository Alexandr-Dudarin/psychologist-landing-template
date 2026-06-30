export const CONTACT_NAME_PART_MAX_LENGTH = 30;
export const CONTACT_NAME_TOTAL_MAX_LENGTH = 60;
export const CONTACT_EMAIL_MAX_LENGTH = 80;
export const CONTACT_MESSAGE_MAX_LENGTH = 400;

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_ALLOWED_CHARS_PATTERN = /^\+?[0-9\s()-]+$/;
const RUSSIAN_PHONE_PATTERN = /^(?:\+7|8)\d{10}$/;

export function normalizeContactNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeRussianPhoneForStorage(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue || !PHONE_ALLOWED_CHARS_PATTERN.test(trimmedValue)) {
    return null;
  }

  const normalizedValue = trimmedValue.replace(/[\s()-]/g, "");

  if (!RUSSIAN_PHONE_PATTERN.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

export function isValidContactEmail(value: string): boolean {
  const normalizedValue = value.trim();

  return (
    normalizedValue.length > 0 &&
    normalizedValue.length <= CONTACT_EMAIL_MAX_LENGTH &&
    EMAIL_PATTERN.test(normalizedValue)
  );
}

export function getContactNameValidationError(params: {
  firstName: string;
  lastName: string;
}): string | null {
  if (
    params.firstName.length > CONTACT_NAME_PART_MAX_LENGTH ||
    params.lastName.length > CONTACT_NAME_PART_MAX_LENGTH
  ) {
    return `Имя и фамилия должны быть не длиннее ${CONTACT_NAME_PART_MAX_LENGTH} символов каждое.`;
  }

  if (params.firstName.length + params.lastName.length > CONTACT_NAME_TOTAL_MAX_LENGTH) {
    return `Имя и фамилия вместе должны быть не длиннее ${CONTACT_NAME_TOTAL_MAX_LENGTH} символов.`;
  }

  return null;
}