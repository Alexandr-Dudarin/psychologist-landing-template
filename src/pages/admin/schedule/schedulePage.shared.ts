import type {
  BlockedSlotRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
} from "../../../types/schedule";
import { getBookingTimezoneOptionGroups } from "../../../lib/booking/bookingTimezones";

export const weekdayLabels: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

export type SettingsForm = {
  minAdvanceHours: string;
  bufferMinutes: string;
  allowSameDayBooking: boolean;
  maxDaysAhead: string;
  timezone: string;
};

export type OverrideForm = {
  date: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  note: string;
};

export type BlockedSlotForm = {
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type FeedbackArea = "settings" | "overrides" | "blockedSlots";

export type FeedbackTone = "success" | "error";

export type FeedbackState =
  | {
      area: FeedbackArea;
      tone: FeedbackTone;
      message: string;
    }
  | null;

export const defaultSettingsForm: SettingsForm = {
  minAdvanceHours: "3",
  bufferMinutes: "30",
  allowSameDayBooking: true,
  maxDaysAhead: "30",
  timezone: "Europe/Moscow",
};

export const bookingTimezoneOptionGroups = getBookingTimezoneOptionGroups("ru");

export const defaultRules: ScheduleRuleRecord[] = [
  { weekday: 1, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 2, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 3, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 4, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 5, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 6, isEnabled: false, startTime: "10:00", endTime: "19:00" },
  { weekday: 7, isEnabled: false, startTime: "10:00", endTime: "19:00" },
];

export const initialOverrideForm: OverrideForm = {
  date: "",
  isWorkingDay: false,
  startTime: "10:00",
  endTime: "19:00",
  note: "",
};

export const initialBlockedSlotForm: BlockedSlotForm = {
  blockedDate: "",
  startTime: "10:00",
  endTime: "11:00",
  reason: "",
};

export function normalizeDateOnly(value: string) {
  return value.slice(0, 10);
}

export function formatDate(value: string) {
  const dateOnly = normalizeDateOnly(value);
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) {
    return dateOnly || "-";
  }

  return new Date(year, month - 1, day).toLocaleDateString("ru-RU");
}

export function getScopedFeedback(
  feedback: FeedbackState,
  area: FeedbackArea
) {
  if (!feedback || feedback.area !== area) {
    return null;
  }

  return feedback;
}

export function mapOverrideToForm(item: ScheduleOverrideRecord): OverrideForm {
  return {
    date: normalizeDateOnly(item.date),
    isWorkingDay: item.isWorkingDay,
    startTime: item.startTime ?? "10:00",
    endTime: item.endTime ?? "19:00",
    note: item.note,
  };
}

export function mapBlockedSlotToForm(item: BlockedSlotRecord): BlockedSlotForm {
  return {
    blockedDate: normalizeDateOnly(item.blockedDate),
    startTime: item.startTime,
    endTime: item.endTime,
    reason: item.reason,
  };
}

export type ScheduleOverrideList = ScheduleOverrideRecord[];
export type BlockedSlotsList = BlockedSlotRecord[];
