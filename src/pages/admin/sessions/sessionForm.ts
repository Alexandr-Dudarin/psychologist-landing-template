import type { SessionStatus } from "../../../types/session";

export type SessionForm = {
  clientId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: string;
  price: string;
  status: SessionStatus;
  notes: string;
};

export const initialCreateForm: SessionForm = {
  clientId: "",
  serviceId: "",
  scheduledAt: "",
  durationMinutes: "60",
  price: "0",
  status: "scheduled",
  notes: "",
};

export const initialEditForm: SessionForm = {
  clientId: "",
  serviceId: "",
  scheduledAt: "",
  durationMinutes: "60",
  price: "0",
  status: "scheduled",
  notes: "",
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  scheduled: "Запланирована",
  completed: "Проведена",
  cancelled: "Отменена",
  no_show: "Неявка",
};

export function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function getNowDateTimeLocalValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function isPastDateTimeLocal(value: string): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() < Date.now();
}