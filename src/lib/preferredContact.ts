import {
  preferredContactMethods,
  type PreferredContactFields,
  type PreferredContactMethod,
} from "../types/preferredContact.js";

export type PreferredContactLanguage = "ru" | "en";

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

export const preferredContactPlaceholdersByLanguage: Record<
  PreferredContactLanguage,
  Record<PreferredContactMethod, string>
> = {
  ru: {
    whatsapp: "+7 999 123-45-67",
    telegram: "username или телефон или t.me/username или @username",
    email: "name@example.com",
    sms: "+7 999 123-45-67",
    vk: "https://vk.com/id123456 или id123456",
  },
  en: {
    whatsapp: "+7 999 123-45-67",
    telegram: "username, phone number, t.me/username, or @username",
    email: "name@example.com",
    sms: "+7 999 123-45-67",
    vk: "https://vk.com/id123456 or id123456",
  },
};

export const preferredContactPlaceholders =
  preferredContactPlaceholdersByLanguage.ru;

export type PreferredContactValidationErrors = Partial<
  Record<keyof PreferredContactFields, string>
>;

export type PreferredContactValidationMessages = {
  methodRequired: string;
  valueRequired: string;
  emailInvalid: string;
  phoneInvalid: string;
  telegramInvalid: string;
  vkInvalid: string;
};

export const preferredContactValidationMessagesByLanguage: Record<
  PreferredContactLanguage,
  PreferredContactValidationMessages
> = {
  ru: {
    methodRequired: "Выберите предпочтительный способ связи.",
    valueRequired: "Укажите контакт для выбранного способа связи.",
    emailInvalid: "Введите корректный email.",
    phoneInvalid: "Введите телефон, минимум 10 цифр.",
    telegramInvalid:
      "Введите username или телефон или @username или t.me/username без кириллицы.",
    vkInvalid: "Введите полную ссылку VK, id123456 или числовой ID.",
  },
  en: {
    methodRequired: "Choose a preferred contact method.",
    valueRequired: "Enter the contact for the selected method.",
    emailInvalid: "Enter a valid email.",
    phoneInvalid: "Enter a phone number with at least 10 digits.",
    telegramInvalid:
      "Enter a username, phone number, @username, or t.me/username without Cyrillic characters.",
    vkInvalid: "Enter a full VK link, id123456, or numeric ID.",
  },
};

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
    preferredContactValue: typeof value === "string" ? value.trim() : "",
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
  },
  messages: PreferredContactValidationMessages =
    preferredContactValidationMessagesByLanguage.ru
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
    errors.preferredContactMethod = messages.methodRequired;
    return errors;
  }

  if (!value) {
    errors.preferredContactValue = messages.valueRequired;
    return errors;
  }

  if (method === "email" && !isValidEmail(value)) {
    errors.preferredContactValue = messages.emailInvalid;
  }

  if (
    (method === "whatsapp" || method === "sms") &&
    !hasEnoughPhoneDigits(value)
  ) {
    errors.preferredContactValue = messages.phoneInvalid;
  }

  if (method === "telegram" && !isValidTelegram(value)) {
    errors.preferredContactValue = messages.telegramInvalid;
  }

  if (method === "vk" && !isValidVk(value)) {
    errors.preferredContactValue = messages.vkInvalid;
  }

  return errors;
}