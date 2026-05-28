import type {
  SchedulerDaySummary,
  SchedulerOverlayItem,
} from "./premiumScheduler.shared";
import { getTodayDateKeyInTimeZone } from "../../../lib/datetime/practiceTimezone";

const MINUTES_IN_HOUR = 60;
const GRID_START_HOUR = 7;

export const WEEK_ROW_HEIGHT = 96;
export const DAY_ROW_HEIGHT = 124;

export type SchedulerDetail = {
  kind: "day" | "session" | "blocked";
  title: string;
  subtitle: string;
  chips: string[];
  note: string;
  primaryHref: string;
  secondaryHref: string;
  tertiaryHref: string;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel: string;
};

export function getTodayDateKey(timezone = "Europe/Moscow"): string {
  return getTodayDateKeyInTimeZone(timezone);
}

export function formatOverlayPosition(
  startMinutes: number,
  durationMinutes: number,
  rowHeight: number
) {
  const top =
    ((startMinutes - GRID_START_HOUR * MINUTES_IN_HOUR) / MINUTES_IN_HOUR) *
    rowHeight;
  const height = Math.max((durationMinutes / MINUTES_IN_HOUR) * rowHeight, 72);

  return {
    top,
    height,
  };
}

export function truncateText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}

export function getDayWorkingHours(summary: SchedulerDaySummary): string {
  if (
    !summary.isWorking ||
    summary.workStartMinutes === null ||
    summary.workEndMinutes === null
  ) {
    return "Вне рабочих часов";
  }

  const toLabel = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(
      value % 60
    ).padStart(2, "0")}`;

  return `${toLabel(summary.workStartMinutes)} - ${toLabel(
    summary.workEndMinutes
  )}`;
}

export function getDayDetail(summary: SchedulerDaySummary): SchedulerDetail {
  const encodedDateKey = encodeURIComponent(summary.dateKey);
  const chips = [
    `Сессий: ${summary.sessionsCount}`,
    `Блокировок: ${summary.blockedCount}`,
    summary.loadLabel,
    summary.compactWorkingLabel,
  ];

  const note =
    summary.isOverride && summary.overrideNotePreview !== "Без заметки"
      ? `Комментарий к исключению: ${summary.overrideNotePreview}`
      : summary.isWorking
        ? `Рабочее окно: ${getDayWorkingHours(summary)}. В режиме дня колонка показывает последовательную ленту записей по времени без лишнего визуального шума.`
        : "День помечен как нерабочий. Сетка остается обзорной и мягко подчеркивает недоступные часы без лишнего визуального шума.";

  return {
    kind: "day",
    title: summary.fullLabel,
    subtitle: `${summary.workingLabel}. ${getDayWorkingHours(summary)}`,
    chips,
    note,
    primaryHref: `/admin/sessions?date=${encodedDateKey}`,
    secondaryHref: `/admin/scheduler?view=day&date=${encodedDateKey}`,
    tertiaryHref: "/admin/schedule",
    primaryLabel:
      summary.sessionsCount > 0 ? "Сессии дня" : "Открыть список сессий",
    secondaryLabel: "Расписание дня",
    tertiaryLabel: "Настройки графика",
  };
}

export function getOverlayDetail(item: SchedulerOverlayItem): SchedulerDetail {
  if (item.tone === "session") {
    return {
      kind: "session",
      title: item.clientName,
      subtitle: `${item.serviceTitle}. ${item.timeLabel}`,
      chips: [item.statusLabel, item.timeLabel, item.serviceTitle],
      note: item.notePreview,
      primaryHref: `/admin/clients?highlightClientId=${item.clientId}`,
      secondaryHref: `/admin/sessions?highlightSessionId=${item.sessionId}&clientId=${item.clientId}`,
      tertiaryHref: `/admin/notes?clientId=${item.clientId}&sessionId=${item.sessionId}`,
      primaryLabel: "К клиенту",
      secondaryLabel: "К сессии",
      tertiaryLabel: "К заметкам",
    };
  }

  return {
    kind: "blocked",
    title: "Заблокированный слот",
    subtitle: item.timeLabel,
    chips: ["Блокировка", item.timeLabel],
    note: item.reasonPreview,
    primaryHref: "/admin/schedule",
    secondaryHref: "/admin/sessions",
    tertiaryHref: "/admin/notes",
    primaryLabel: "К графику",
    secondaryLabel: "К сессиям",
    tertiaryLabel: "К заметкам",
  };
}

export function getWeekSummaryLabel(day: SchedulerDaySummary) {
  if (day.blockedCount > 0 && day.sessionsCount > 0) {
    return `${day.sessionsCount} сесс. / ${day.blockedCount} блок.`;
  }

  if (day.blockedCount > 0) {
    return `${day.blockedCount} блок.`;
  }

  if (day.sessionsCount > 0) {
    return `${day.sessionsCount} сессии`;
  }

  return "Свободно";
}