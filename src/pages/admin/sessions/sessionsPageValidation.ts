import type {
  CreateSessionPayload,
  UpdateSessionPayload,
} from "../../../types/session";

function getDateTimestamp(value: string): number | null {
  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasScheduledAtChanged(
  previousScheduledAt: string | null | undefined,
  nextScheduledAt: string
): boolean {
  if (!previousScheduledAt) {
    return true;
  }

  const previousTimestamp = getDateTimestamp(previousScheduledAt);
  const nextTimestamp = getDateTimestamp(nextScheduledAt);

  if (previousTimestamp === null || nextTimestamp === null) {
    return true;
  }

  return Math.abs(previousTimestamp - nextTimestamp) > 1000;
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

  if (!payload.scheduledAt || Number.isNaN(new Date(payload.scheduledAt).getTime())) {
    return "Укажите дату и время сессии.";
  }

  if (new Date(payload.scheduledAt).getTime() < Date.now()) {
    return "Нельзя создать сессию в прошлом.";
  }

  if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes <= 0) {
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
  previousScheduledAt?: string | null
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

  if (!payload.scheduledAt || Number.isNaN(new Date(payload.scheduledAt).getTime())) {
    return "Укажите дату и время сессии.";
  }

  if (
    hasScheduledAtChanged(previousScheduledAt, payload.scheduledAt) &&
    new Date(payload.scheduledAt).getTime() < Date.now()
  ) {
    return "Нельзя перенести сессию в прошлое.";
  }

  if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes <= 0) {
    return "Укажите корректную длительность.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену.";
  }

  return null;
}