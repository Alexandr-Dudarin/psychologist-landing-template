import {
  formatMonthTitle,
  getMonthGrid,
  parseDateKey,
  startOfWeek,
  toDateKey,
} from "../../../components/calendar/calendar.utils";
import type {
  BlockedSlotRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
} from "../../../types/schedule";
import type { CrmSessionRecord } from "../../../types/session";

export type SchedulerViewMode = "week" | "day" | "month";

export type SchedulerOverlayItem = {
  id: string;
  title: string;
  subtitle: string;
  dayKey: string;
  startMinutes: number;
  durationMinutes: number;
  tone: "session" | "blocked";
};

export type SchedulerMonthCellSummary = {
  date: string;
  inCurrentMonth: boolean;
  sessionsCount: number;
  blockedCount: number;
  hasOverride: boolean;
  isWorkingOverride: boolean;
  isWorkingByRule: boolean;
};

const SCHEDULER_START_HOUR = 7;
const SCHEDULER_END_HOUR = 21;

function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDateLabel(dateKey: string, locale: string): string {
  const date = parseDateKey(dateKey);

  if (!date) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function getTimeLabel(hours: number): string {
  return `${String(hours).padStart(2, "0")}:00`;
}

function getMinutesSinceStartOfDay(value: string): number {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function getDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

function toWeekday(dateKey: string): number {
  const date = parseDateKey(dateKey);

  if (!date) {
    return 1;
  }

  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function getRuleForDate(
  dateKey: string,
  rules: ScheduleRuleRecord[],
  overrides: ScheduleOverrideRecord[]
) {
  const override = overrides.find((item) => item.date.slice(0, 10) === dateKey);

  if (override) {
    return {
      isOverride: true,
      isWorking: override.isWorkingDay,
      label: override.isWorkingDay ? "Override: рабочий день" : "Override: выходной",
    };
  }

  const rule = rules.find((item) => item.weekday === toWeekday(dateKey));

  return {
    isOverride: false,
    isWorking: rule?.isEnabled ?? false,
    label: rule?.isEnabled ? "По базовому правилу рабочий день" : "По базовому правилу выходной",
  };
}

export function getSchedulerHours(): Array<{ hour: number; label: string }> {
  return Array.from(
    { length: SCHEDULER_END_HOUR - SCHEDULER_START_HOUR + 1 },
    (_, index) => {
      const hour = SCHEDULER_START_HOUR + index;

      return {
        hour,
        label: getTimeLabel(hour),
      };
    }
  );
}

export function getWeekDays(anchorDateKey: string): string[] {
  const parsed = parseDateKey(anchorDateKey) ?? startOfDay(new Date());
  const weekStart = startOfWeek(parsed, 1);

  return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(weekStart, index)));
}

export function getDateRangeLabel(
  mode: SchedulerViewMode,
  anchorDateKey: string,
  locale: string
): string {
  if (mode === "month") {
    return formatMonthTitle(anchorDateKey.slice(0, 7), locale);
  }

  if (mode === "day") {
    return getDateLabel(anchorDateKey, locale);
  }

  const weekDays = getWeekDays(anchorDateKey);
  const firstDay = parseDateKey(weekDays[0]);
  const lastDay = parseDateKey(weekDays[6]);

  if (!firstDay || !lastDay) {
    return weekDays[0];
  }

  const sameMonth = firstDay.getUTCMonth() === lastDay.getUTCMonth();
  const firstLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  }).format(firstDay);
  const lastLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(lastDay);

  return `${firstLabel} - ${lastLabel}`;
}

export function getNextAnchorDate(
  mode: SchedulerViewMode,
  anchorDateKey: string,
  direction: 1 | -1
): string {
  const parsed = parseDateKey(anchorDateKey) ?? startOfDay(new Date());

  if (mode === "month") {
    return toDateKey(
      new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + direction, 1))
    );
  }

  if (mode === "day") {
    return toDateKey(addDays(parsed, direction));
  }

  return toDateKey(addDays(parsed, direction * 7));
}

export function buildSchedulerOverlayItems(params: {
  viewMode: SchedulerViewMode;
  anchorDateKey: string;
  sessions: CrmSessionRecord[];
  blockedSlots: BlockedSlotRecord[];
}): SchedulerOverlayItem[] {
  const visibleDates =
    params.viewMode === "day"
      ? [params.anchorDateKey]
      : getWeekDays(params.anchorDateKey);

  const visibleDateSet = new Set(visibleDates);
  const items: SchedulerOverlayItem[] = [];

  for (const session of params.sessions) {
    const dayKey = session.scheduledAt.slice(0, 10);

    if (!visibleDateSet.has(dayKey)) {
      continue;
    }

    items.push({
      id: `session-${session.id}`,
      title: session.clientName,
      subtitle: `${session.serviceTitle} • ${session.status}`,
      dayKey,
      startMinutes: getMinutesSinceStartOfDay(session.scheduledAt),
      durationMinutes: session.durationMinutes,
      tone: "session",
    });
  }

  for (const blockedSlot of params.blockedSlots) {
    const dayKey = blockedSlot.blockedDate.slice(0, 10);

    if (!visibleDateSet.has(dayKey)) {
      continue;
    }

    items.push({
      id: `blocked-${blockedSlot.id}`,
      title: "Блокировка",
      subtitle: blockedSlot.reason || "Слот закрыт",
      dayKey,
      startMinutes: getDurationMinutes("00:00", blockedSlot.startTime),
      durationMinutes: getDurationMinutes(blockedSlot.startTime, blockedSlot.endTime),
      tone: "blocked",
    });
  }

  return items;
}

export function buildMonthSummary(params: {
  anchorDateKey: string;
  sessions: CrmSessionRecord[];
  blockedSlots: BlockedSlotRecord[];
  overrides: ScheduleOverrideRecord[];
  rules: ScheduleRuleRecord[];
}): SchedulerMonthCellSummary[] {
  const monthGrid = getMonthGrid(params.anchorDateKey.slice(0, 7), 1);

  return monthGrid.map((item) => {
    const sessionsCount = params.sessions.filter(
      (session) => session.scheduledAt.slice(0, 10) === item.date
    ).length;
    const blockedCount = params.blockedSlots.filter(
      (slot) => slot.blockedDate.slice(0, 10) === item.date
    ).length;
    const ruleInfo = getRuleForDate(item.date, params.rules, params.overrides);

    return {
      date: item.date,
      inCurrentMonth: item.inCurrentMonth,
      sessionsCount,
      blockedCount,
      hasOverride: ruleInfo.isOverride,
      isWorkingOverride: ruleInfo.isOverride && ruleInfo.isWorking,
      isWorkingByRule: ruleInfo.isWorking,
    };
  });
}

export function getSchedulerDaySummaries(params: {
  viewMode: SchedulerViewMode;
  anchorDateKey: string;
  sessions: CrmSessionRecord[];
  blockedSlots: BlockedSlotRecord[];
  overrides: ScheduleOverrideRecord[];
  rules: ScheduleRuleRecord[];
  locale: string;
}) {
  const visibleDates =
    params.viewMode === "day"
      ? [params.anchorDateKey]
      : getWeekDays(params.anchorDateKey);

  return visibleDates.map((dateKey) => {
    const sessionsCount = params.sessions.filter(
      (session) => session.scheduledAt.slice(0, 10) === dateKey
    ).length;
    const blockedCount = params.blockedSlots.filter(
      (slot) => slot.blockedDate.slice(0, 10) === dateKey
    ).length;
    const ruleInfo = getRuleForDate(dateKey, params.rules, params.overrides);

    return {
      dateKey,
      label: getDateLabel(dateKey, params.locale),
      sessionsCount,
      blockedCount,
      workingLabel: ruleInfo.label,
      isWorking: ruleInfo.isWorking,
    };
  });
}
