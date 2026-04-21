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
import type { CrmSessionRecord, SessionStatus } from "../../../types/session";

export type SchedulerViewMode = "week" | "day" | "month";

export type SchedulerOverlayItem =
  | {
      id: string;
      dayKey: string;
      startMinutes: number;
      durationMinutes: number;
      tone: "session";
      title: string;
      subtitle: string;
      timeLabel: string;
      statusLabel: string;
      notePreview: string;
      clientName: string;
      serviceTitle: string;
      sessionId: number;
      clientId: number;
      laneIndex: number;
      laneCount: number;
    }
  | {
      id: string;
      dayKey: string;
      startMinutes: number;
      durationMinutes: number;
      tone: "blocked";
      title: string;
      subtitle: string;
      timeLabel: string;
      reasonPreview: string;
      blockedSlotId: number;
    };

export type SchedulerDaySummary = {
  dateKey: string;
  label: string;
  sessionsCount: number;
  blockedCount: number;
  workingLabel: string;
  isWorking: boolean;
  isOverride: boolean;
  workingStateTone: "working" | "override-working" | "day-off" | "override-day-off";
  workStartMinutes: number | null;
  workEndMinutes: number | null;
  nonWorkingRanges: Array<{
    id: string;
    startMinutes: number;
    durationMinutes: number;
    tone: "non-working" | "day-off";
  }>;
  loadLabel: string;
  overrideNotePreview: string;
};

export type SchedulerMonthCellSummary = {
  date: string;
  inCurrentMonth: boolean;
  sessionsCount: number;
  blockedCount: number;
  hasOverride: boolean;
  isWorkingOverride: boolean;
  isWorkingByRule: boolean;
  workingStateTone: "working" | "override-working" | "day-off" | "override-day-off";
  workingStateLabel: string;
  activityLabel: string;
  loadLevel: "free" | "light" | "medium" | "busy";
  overrideNotePreview: string;
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

function getTimeRangeLabel(startMinutes: number, durationMinutes: number): string {
  const endMinutes = startMinutes + durationMinutes;

  function toLabel(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return `${toLabel(startMinutes)} - ${toLabel(endMinutes)}`;
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

function getMinutesFromTimeLabel(time: string | null): number | null {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "scheduled":
      return "Запланирована";
    case "completed":
      return "Завершена";
    case "cancelled":
      return "Отменена";
    case "no_show":
      return "Не пришёл";
    default:
      return status;
  }
}

function truncatePreview(value: string, maxLength = 88): string {
  const compact = value.replace(/\s+/g, " ").trim();

  if (!compact) {
    return "Без заметки";
  }

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
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
      label: override.isWorkingDay ? "Исключение: рабочий день" : "Исключение: выходной",
      startTime: override.startTime,
      endTime: override.endTime,
      note: override.note,
    };
  }

  const rule = rules.find((item) => item.weekday === toWeekday(dateKey));

  return {
    isOverride: false,
    isWorking: rule?.isEnabled ?? false,
    label: rule?.isEnabled ? "Рабочий день по базовому правилу" : "Выходной по базовому правилу",
    startTime: rule?.startTime ?? null,
    endTime: rule?.endTime ?? null,
    note: "",
  };
}

function getWorkingStateTone(ruleInfo: ReturnType<typeof getRuleForDate>) {
  if (ruleInfo.isOverride && ruleInfo.isWorking) {
    return "override-working" as const;
  }

  if (ruleInfo.isOverride && !ruleInfo.isWorking) {
    return "override-day-off" as const;
  }

  if (ruleInfo.isWorking) {
    return "working" as const;
  }

  return "day-off" as const;
}

function getLoadLabel(sessionsCount: number): string {
  if (sessionsCount >= 6) {
    return "Плотный день";
  }

  if (sessionsCount >= 4) {
    return "Средняя загрузка";
  }

  if (sessionsCount >= 2) {
    return "Лёгкая загрузка";
  }

  if (sessionsCount === 1) {
    return "Лёгкая загрузка";
  }

  return "Свободно";
}

function getMonthLoadLevel(sessionsCount: number): SchedulerMonthCellSummary["loadLevel"] {
  if (sessionsCount >= 6) {
    return "busy";
  }

  if (sessionsCount >= 4) {
    return "medium";
  }

  if (sessionsCount >= 1) {
    return "light";
  }

  return "free";
}

function buildSessionLanes(
  sessions: Array<{
    id: number;
    startMinutes: number;
    durationMinutes: number;
  }>
) {
  const laneEndMinutes: number[] = [];
  const laneAssignments = new Map<number, { laneIndex: number; laneCount: number }>();

  for (const session of sessions) {
    const endMinutes = session.startMinutes + session.durationMinutes;
    let nextLaneIndex = laneEndMinutes.findIndex((laneEnd) => laneEnd <= session.startMinutes);

    if (nextLaneIndex === -1) {
      nextLaneIndex = laneEndMinutes.length;
      laneEndMinutes.push(endMinutes);
    } else {
      laneEndMinutes[nextLaneIndex] = endMinutes;
    }

    laneAssignments.set(session.id, {
      laneIndex: nextLaneIndex,
      laneCount: laneEndMinutes.length,
    });
  }

  return laneAssignments;
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
  const sessionsByDay = new Map<
    string,
    Array<{ id: number; startMinutes: number; durationMinutes: number }>
  >();

  for (const session of params.sessions) {
    const dayKey = session.scheduledAt.slice(0, 10);

    if (!visibleDateSet.has(dayKey)) {
      continue;
    }

    const startMinutes = getMinutesSinceStartOfDay(session.scheduledAt);
    const sessionsForDay = sessionsByDay.get(dayKey) ?? [];
    sessionsForDay.push({
      id: session.id,
      startMinutes,
      durationMinutes: session.durationMinutes,
    });
    sessionsByDay.set(dayKey, sessionsForDay);
  }

  const laneMaps = new Map<string, ReturnType<typeof buildSessionLanes>>();

  for (const [dayKey, sessionsForDay] of sessionsByDay) {
    const orderedSessions = [...sessionsForDay].sort((left, right) => {
      if (left.startMinutes === right.startMinutes) {
        return left.durationMinutes - right.durationMinutes;
      }

      return left.startMinutes - right.startMinutes;
    });

    laneMaps.set(dayKey, buildSessionLanes(orderedSessions));
  }

  for (const session of params.sessions) {
    const dayKey = session.scheduledAt.slice(0, 10);

    if (!visibleDateSet.has(dayKey)) {
      continue;
    }

    const startMinutes = getMinutesSinceStartOfDay(session.scheduledAt);
    const timeLabel = getTimeRangeLabel(startMinutes, session.durationMinutes);
    const laneData = laneMaps.get(dayKey)?.get(session.id) ?? {
      laneIndex: 0,
      laneCount: 1,
    };

    items.push({
      id: `session-${session.id}`,
      title: session.clientName,
      subtitle: session.serviceTitle,
      dayKey,
      startMinutes,
      durationMinutes: session.durationMinutes,
      tone: "session",
      timeLabel,
      statusLabel: getStatusLabel(session.status),
      notePreview: truncatePreview(session.notes),
      clientName: session.clientName,
      serviceTitle: session.serviceTitle,
      sessionId: session.id,
      clientId: session.clientId,
      laneIndex: laneData.laneIndex,
      laneCount: laneData.laneCount,
    });
  }

  for (const blockedSlot of params.blockedSlots) {
    const dayKey = blockedSlot.blockedDate.slice(0, 10);

    if (!visibleDateSet.has(dayKey)) {
      continue;
    }

    const startMinutes = getDurationMinutes("00:00", blockedSlot.startTime);
    const durationMinutes = getDurationMinutes(blockedSlot.startTime, blockedSlot.endTime);
    const timeLabel = getTimeRangeLabel(startMinutes, durationMinutes);

    items.push({
      id: `blocked-${blockedSlot.id}`,
      title: "Блокировка",
      subtitle: blockedSlot.reason || "Слот закрыт",
      dayKey,
      startMinutes,
      durationMinutes,
      tone: "blocked",
      timeLabel,
      reasonPreview: truncatePreview(blockedSlot.reason || "Слот закрыт"),
      blockedSlotId: blockedSlot.id,
    });
  }

  return items.sort((left, right) => {
    if (left.dayKey === right.dayKey) {
      if (left.startMinutes === right.startMinutes) {
        if (left.tone === "session" && right.tone === "session") {
          return left.laneIndex - right.laneIndex;
        }

        return left.tone === "blocked" ? -1 : 1;
      }

      return left.startMinutes - right.startMinutes;
    }

    return left.dayKey.localeCompare(right.dayKey);
  });
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
    const workingStateTone = getWorkingStateTone(ruleInfo);
    const loadLevel = getMonthLoadLevel(sessionsCount);

    return {
      date: item.date,
      inCurrentMonth: item.inCurrentMonth,
      sessionsCount,
      blockedCount,
      hasOverride: ruleInfo.isOverride,
      isWorkingOverride: ruleInfo.isOverride && ruleInfo.isWorking,
      isWorkingByRule: ruleInfo.isWorking,
      workingStateTone,
      workingStateLabel: ruleInfo.label,
      activityLabel:
        blockedCount > 0
          ? `Блокировок: ${blockedCount}`
          : sessionsCount > 0
          ? getLoadLabel(sessionsCount)
          : "Свободный день",
      loadLevel,
      overrideNotePreview: truncatePreview(ruleInfo.note, 64),
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
}): SchedulerDaySummary[] {
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
    const workStartMinutes = getMinutesFromTimeLabel(ruleInfo.startTime);
    const workEndMinutes = getMinutesFromTimeLabel(ruleInfo.endTime);
    const nonWorkingRanges: SchedulerDaySummary["nonWorkingRanges"] = [];

    if (!ruleInfo.isWorking) {
      nonWorkingRanges.push({
        id: `${dateKey}-day-off`,
        startMinutes: SCHEDULER_START_HOUR * 60,
        durationMinutes: (SCHEDULER_END_HOUR - SCHEDULER_START_HOUR + 1) * 60,
        tone: "day-off",
      });
    } else {
      if (workStartMinutes && workStartMinutes > SCHEDULER_START_HOUR * 60) {
        nonWorkingRanges.push({
          id: `${dateKey}-before-work`,
          startMinutes: SCHEDULER_START_HOUR * 60,
          durationMinutes: workStartMinutes - SCHEDULER_START_HOUR * 60,
          tone: "non-working",
        });
      }

      if (workEndMinutes && workEndMinutes < (SCHEDULER_END_HOUR + 1) * 60) {
        nonWorkingRanges.push({
          id: `${dateKey}-after-work`,
          startMinutes: workEndMinutes,
          durationMinutes: (SCHEDULER_END_HOUR + 1) * 60 - workEndMinutes,
          tone: "non-working",
        });
      }
    }

    return {
      dateKey,
      label: getDateLabel(dateKey, params.locale),
      sessionsCount,
      blockedCount,
      workingLabel: ruleInfo.label,
      isWorking: ruleInfo.isWorking,
      isOverride: ruleInfo.isOverride,
      workingStateTone: getWorkingStateTone(ruleInfo),
      workStartMinutes,
      workEndMinutes,
      nonWorkingRanges,
      loadLabel: getLoadLabel(sessionsCount),
      overrideNotePreview: truncatePreview(ruleInfo.note, 72),
    };
  });
}
