import type { ClientStatus, CrmClientRecord } from "../../../types/client";
import type { PreferredContactFields } from "../../../types/preferredContact";

export const CLIENT_NAME_PART_MAX_LENGTH = 20;

type NamePartSanitizeOptions = {
  allowSpaces?: boolean;
};

type NamePartValidationOptions = NamePartSanitizeOptions & {
  label: string;
  required?: boolean;
};

export type ClientNameParts = {
  firstName: string;
  lastName: string;
};

export type ClientNameValidationErrors = {
  firstName?: string;
  lastName?: string;
};

export type ClientForm = PreferredContactFields & {
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
};

export type ManualClientForm = ClientForm;

export const initialForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  preferredContactMethod: "",
  preferredContactValue: "",
  source: "",
  status: "active",
};

function countCharacters(value: string) {
  return Array.from(value).length;
}

function limitCharacters(value: string, maxLength: number) {
  return Array.from(value).slice(0, maxLength).join("");
}

function getNamePartPattern(allowSpaces = false) {
  return allowSpaces
    ? /^\p{L}+(?:[ -]\p{L}+)*$/u
    : /^\p{L}+(?:-\p{L}+)*$/u;
}

export function sanitizeClientNamePartInput(
  value: string,
  options: NamePartSanitizeOptions = {}
): string {
  const invalidCharsPattern = options.allowSpaces
    ? /[^\p{L}\s-]/gu
    : /[^\p{L}-]/gu;

  const cleanedValue = value
    .replace(invalidCharsPattern, "")
    .replace(/\s+/g, " ");

  return limitCharacters(cleanedValue, CLIENT_NAME_PART_MAX_LENGTH);
}

export function normalizeClientNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateClientNamePart(
  value: string,
  options: NamePartValidationOptions
): string {
  const normalizedValue = normalizeClientNamePart(value);

  if (!normalizedValue) {
    return options.required ? `${options.label} обязательно.` : "";
  }

  if (countCharacters(normalizedValue) > CLIENT_NAME_PART_MAX_LENGTH) {
    return `${options.label} не должно быть длиннее ${CLIENT_NAME_PART_MAX_LENGTH} символов.`;
  }

  if (!getNamePartPattern(options.allowSpaces).test(normalizedValue)) {
    return options.allowSpaces
      ? `${options.label} может содержать только буквы, пробелы и дефис.`
      : `${options.label} может содержать только буквы и дефис.`;
  }

  return "";
}

export function validateClientNameParts(
  firstName: string,
  lastName: string
): ClientNameValidationErrors {
  const firstNameError = validateClientNamePart(firstName, {
    label: "Имя клиента",
    required: true,
  });

  const lastNameError = validateClientNamePart(lastName, {
    label: "Фамилия клиента",
    allowSpaces: true,
    required: false,
  });

  return {
    firstName: firstNameError || undefined,
    lastName: lastNameError || undefined,
  };
}

export function splitClientName(fullName: string): ClientNameParts {
  const normalizedName = fullName.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const [firstName = "", ...rest] = normalizedName.split(" ");

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function buildClientName(firstName: string, lastName: string): string {
  return [
    normalizeClientNamePart(firstName),
    normalizeClientNamePart(lastName),
  ]
    .filter(Boolean)
    .join(" ");
}

export function mapClientToForm(client: CrmClientRecord): ClientForm {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    preferredContactMethod: client.preferredContactMethod ?? "",
    preferredContactValue: client.preferredContactValue ?? "",
    source: client.source,
    status: client.status,
  };
}