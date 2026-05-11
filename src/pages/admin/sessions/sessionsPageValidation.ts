import type {
  CreateSessionPayload,
  UpdateSessionPayload,
} from "../../../types/session";

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
  _timezone: string
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

  if (new Date(payload.scheduledAt).getTime() < Date.now()) {
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
