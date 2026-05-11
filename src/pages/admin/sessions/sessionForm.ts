import {
  formatDateTimeLocalSummaryInTimeZone,
  getNowDateTimeLocalValueInTimeZone,
  isPastDateTimeLocalInTimeZone,
  toDateTimeLocalValueInTimeZone,
} from "../../../lib/datetime/practiceTimezone";
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

export const sessionSourceLabels: Record<string, string> = {
  manual: "Вручную",
  website: "Онлайн-запись",
};

export function getSessionSourceLabel(source: string): string {
  return sessionSourceLabels[source] ?? source;
}

export function toDateTimeLocalValue(
  value: string,
  timezone = "Europe/Moscow"
): string {
  return toDateTimeLocalValueInTimeZone(value, timezone);
}

export function getNowDateTimeLocalValue(timezone = "Europe/Moscow"): string {
  return getNowDateTimeLocalValueInTimeZone(timezone);
}

export function getDatePartFromDateTimeLocal(value: string): string {
  return value.includes("T") ? value.slice(0, 10) : "";
}

export function getTimePartFromDateTimeLocal(value: string): string {
  return value.includes("T") ? value.slice(11, 16) : "";
}

export function buildDateTimeLocalValue(date: string, time: string): string {
  if (!date || !time) {
    return "";
  }

  return `${date}T${time}`;
}

export function formatDateTimeLocalSummary(
  value: string,
  timezone = "Europe/Moscow"
): string {
  return formatDateTimeLocalSummaryInTimeZone(value, timezone);
}

export function isPastDateTimeLocal(
  value: string,
  timezone = "Europe/Moscow"
): boolean {
  return isPastDateTimeLocalInTimeZone(value, timezone);
}
