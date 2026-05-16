import type {
  CreateSessionPayload,
  UpdateSessionPayload,
} from "../../../types/session";

function isValidClientPackageId(value: number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isInteger(value) && value > 0;
}

function getDateTimestamp(value: string): number | null {
  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasScheduledAtChanged(
  currentValue: string,
  nextValue: string
): boolean {
  const currentTimestamp = getDateTimestamp(currentValue);
  const nextTimestamp = getDateTimestamp(nextValue);

  if (currentTimestamp === null || nextTimestamp === null) {
    return true;
  }

  return Math.abs(currentTimestamp - nextTimestamp) > 1000;
}

export function validateCreateSessionPayload(
  payload: CreateSessionPayload,
  _timezone: string
): string | null {
  if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
    return "Выберите клиента.";
  }

  if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
    return "Выберите услугу.";
  }

  if (!isValidClientPackageId(payload.clientPackageId)) {
    return "Выберите корректный пакет клиента.";
  }

  if (
    !payload.scheduledAt ||
    Number.isNaN(new Date(payload.scheduledAt).getTime())
  ) {
    return "Укажите дату и время сессии.";
  }

  if (new Date(payload.scheduledAt).getTime() < Date.now()) {
    return "Нельзя создать сессию в прошлом.";
  }

  if (
    !Number.isInteger(payload.durationMinutes) ||
    payload.durationMinutes <= 0
  ) {
    return "Укажите корректную длительность.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену.";
  }

  return null;
}

export function validateUpdateSessionPayload(
  payload: UpdateSessionPayload,
  _timezone: string,
  originalScheduledAt: string | null = null
): string | null {
  if (!Number.isInteger(payload.id) || payload.id <= 0) {
    return "Некорректная сессия.";
  }

  if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
    return "Выберите клиента.";
  }

  if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
    return "Выберите услугу.";
  }

  if (!isValidClientPackageId(payload.clientPackageId)) {
    return "Выберите корректный пакет клиента.";
  }

  if (
    !payload.scheduledAt ||
    Number.isNaN(new Date(payload.scheduledAt).getTime())
  ) {
    return "Укажите дату и время сессии.";
  }

  if (
    originalScheduledAt &&
    hasScheduledAtChanged(originalScheduledAt, payload.scheduledAt) &&
    new Date(payload.scheduledAt).getTime() < Date.now()
  ) {
    return "Нельзя перенести сессию в прошлое.";
  }

  if (
    !Number.isInteger(payload.durationMinutes) ||
    payload.durationMinutes <= 0
  ) {
    return "Укажите корректную длительность.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену.";
  }

  return null;
}