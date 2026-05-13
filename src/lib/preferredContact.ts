import {
  preferredContactMethods,
  type PreferredContactFields,
  type PreferredContactMethod,
} from "../types/preferredContact.js";

export const preferredContactMethodLabels: Record<
  PreferredContactMethod,
  string
> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  email: "Email",
  sms: "SMS",
  vk: "VKontakte / VK",
};

export const preferredContactPlaceholders: Record<
  PreferredContactMethod,
  string
> = {
  whatsapp: "+7 999 123-45-67",
  telegram: "username или телефон или t.me/username или @username",
  email: "name@example.com",
  sms: "+7 999 123-45-67",
  vk: "https://vk.com/id123456 или id123456",
};

export type PreferredContactValidationErrors = Partial<
  Record<keyof PreferredContactFields, string>
>;

export function isPreferredContactMethod(
  value: unknown
): value is PreferredContactMethod {
  return preferredContactMethods.includes(value as PreferredContactMethod);
}

export function normalizePreferredContactFields(
  method: unknown,
  value: unknown
): PreferredContactFields {
  return {
    preferredContactMethod: isPreferredContactMethod(method) ? method : "",
    preferredContactValue:
      typeof value === "string" ? value.trim() : "",
  };
}

export function normalizePreferredContactForStorage(
  fields: PreferredContactFields
): {
  preferredContactMethod: PreferredContactMethod | null;
  preferredContactValue: string | null;
} {
  const value = fields.preferredContactValue.trim();

  if (!fields.preferredContactMethod || !value) {
    return {
      preferredContactMethod: null,
      preferredContactValue: null,
    };
  }

  return {
    preferredContactMethod: fields.preferredContactMethod,
    preferredContactValue: value,
  };
}

export function formatPreferredContactDisplay(
  method?: PreferredContactMethod | "" | null,
  value?: string | null,
  emptyFallback = "Не указано"
): string {
  const normalized = normalizePreferredContactFields(method, value);

  if (!normalized.preferredContactMethod || !normalized.preferredContactValue) {
    return emptyFallback;
  }

  return `${preferredContactMethodLabels[normalized.preferredContactMethod]}: ${normalized.preferredContactValue}`;
}

export function getPreferredContactValuePreview(
  value: string,
  maxLength = 20
): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 1)}…`;
}

function hasEnoughPhoneDigits(value: string): boolean {
  return value.replace(/\D/g, "").length >= 10;
}

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

function isValidTelegram(value: string): boolean {
  const normalized = value.trim();

  if (hasEnoughPhoneDigits(normalized)) {
    return true;
  }

  const linkMatch = normalized.match(
    /^(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{5,32})\/?$/i
  );

  const username = linkMatch?.[1] ?? normalized.replace(/^@/, "");

  return /^[A-Za-z0-9_]{5,32}$/.test(username);
}

function isValidVk(value: string): boolean {
  const normalized = value.trim();

  if (/^id\d+$/.test(normalized) || /^\d+$/.test(normalized)) {
    return true;
  }

  return /^https?:\/\/(?:www\.|m\.)?vk\.com\/(?:id\d+|\d+)\/?$/i.test(
    normalized
  );
}

export function validatePreferredContactFields(
  fields: PreferredContactFields,
  options: {
    enabled: boolean;
    required: boolean;
  }
): PreferredContactValidationErrors {
  const errors: PreferredContactValidationErrors = {};

  if (!options.enabled) {
    return errors;
  }

  const method = fields.preferredContactMethod;
  const value = fields.preferredContactValue.trim();

  if (!method && !value && !options.required) {
    return errors;
  }

  if (!method) {
    errors.preferredContactMethod = "Выберите предпочтительный способ связи.";
    return errors;
  }

  if (!value) {
    errors.preferredContactValue = "Укажите контакт для выбранного способа связи.";
    return errors;
  }

  if (method === "email" && !isValidEmail(value)) {
    errors.preferredContactValue = "Введите корректный email.";
  }

  if ((method === "whatsapp" || method === "sms") && !hasEnoughPhoneDigits(value)) {
    errors.preferredContactValue = "Введите телефон, минимум 10 цифр.";
  }

  if (method === "telegram" && !isValidTelegram(value)) {
    errors.preferredContactValue =
      "Введите username или телефон или @username или t.me/username без кириллицы.";
  }

  if (method === "vk" && !isValidVk(value)) {
    errors.preferredContactValue =
      "Введите полную ссылку VK, id123456 или числовой ID.";
  }

  return errors;
}
