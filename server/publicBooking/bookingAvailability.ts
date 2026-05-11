/// <reference types="node" />

import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingMonthDayAvailability,
  PublicBookingService,
  PublicBookingSlot,
} from "../../src/types/booking.js";
import type {
  BookingSettingsRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
} from "../../src/types/schedule.js";
import {
  addDaysToDateKey,
  getDateKeyInTimeZone,
  getMinutesSinceStartOfDayInTimeZone,
  getTimeKeyInTimeZone,
  getTodayDateKeyInTimeZone,
  zonedDateTimeToUtcDate,
} from "../../src/lib/datetime/practiceTimezone.js";
import { resolveBookingTimezone } from "../../src/lib/booking/bookingTimezones.js";

const SLOT_STEP_MINUTES = 30;

type Queryable = Pick<PoolClient, "query">;

type ServiceRow = {
  id: string | number;
  title: string;
  description: string;
  price: string | number;
  duration_minutes: string | number;
};

type SettingsRow = {
  min_advance_hours: number | string;
  buffer_minutes: number | string;
  allow_same_day_booking: boolean;
  max_days_ahead: number | string;
  timezone: string | null;
};

type RuleRow = {
  weekday: number | string;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
};

type OverrideRow = {
  override_date: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
};

type BlockedSlotRow = {
  blocked_date: string;
  start_time: string;
  end_time: string;
};

type SessionRow = {
  scheduled_at: string;
  duration_minutes: number | string;
  status: string;
};

type TimeRange = {
  start: Date;
  end: Date;
};

type PublicBookingBaseData = {
  services: PublicBookingService[];
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
  overrides: ScheduleOverrideRecord[];
  blockedSlotRows: BlockedSlotRow[];
};

type PublicBookingAvailabilityErrorReason =
  | "settings_missing"
  | "invalid_service"
  | "invalid_date"
  | "invalid_month"
  | "service_not_found";

type PublicBookingAvailabilitySuccessResult = {
  ok: true;
  payload: PublicBookingAvailabilityResponse;
};

type PublicBookingAvailabilityErrorResult = {
  ok: false;
  reason: PublicBookingAvailabilityErrorReason;
};

export type GetPublicBookingAvailabilityDataResult =
  | PublicBookingAvailabilitySuccessResult
  | PublicBookingAvailabilityErrorResult;

export type SlotValidationResult =
  | {
      ok: true;
      service: PublicBookingService;
      slot: PublicBookingSlot;
      selectedDate: string;
      timezone: string;
    }
  | {
      ok: false;
      reason:
        | "invalid_service"
        | "invalid_date"
        | "invalid_slot"
        | "settings_missing"
        | "outside_booking_window"
        | "slot_unavailable";
    };

function isPublicBookingAvailabilityError(
  result: GetPublicBookingAvailabilityDataResult
): result is PublicBookingAvailabilityErrorResult {
  return result.ok === false;
}

function ensureValidDate(date: Date): Date | null {
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseMonthOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = new Date(year, month - 1, 1);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1) {
    return null;
  }

  return date;
}

function parseTimeParts(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function overlaps(first: TimeRange, second: TimeRange): boolean {
  return first.start < second.end && second.start < first.end;
}

function toWeekday(dateKey: string): number {
  const date = parseDateOnly(dateKey);

  if (!date) {
    return 1;
  }

  const weekday = date.getDay();

  return weekday === 0 ? 7 : weekday;
}

function combineDateAndTime(
  dateKey: string,
  time: string,
  timezone: string
): Date | null {
  return zonedDateTimeToUtcDate(dateKey, time, timezone);
}

function mapSettings(row: SettingsRow): BookingSettingsRecord {
  return {
    minAdvanceHours: Number(row.min_advance_hours),
    bufferMinutes: Number(row.buffer_minutes),
    allowSameDayBooking: row.allow_same_day_booking,
    maxDaysAhead: Number(row.max_days_ahead),
    timezone: resolveBookingTimezone(row.timezone),
  };
}

function mapRule(row: RuleRow): ScheduleRuleRecord {
  return {
    weekday: Number(row.weekday),
    isEnabled: row.is_enabled,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

function mapOverride(row: OverrideRow): ScheduleOverrideRecord {
  return {
    date: row.override_date,
    isWorkingDay: row.is_working_day,
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    endTime: row.end_time ? row.end_time.slice(0, 5) : null,
    note: "",
  };
}

function mapService(row: ServiceRow): PublicBookingService {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    price: Number(row.price),
    durationMinutes: Number(row.duration_minutes),
  };
}

export function getBookingWindow(settings: BookingSettingsRecord, now: Date) {
  const minStart = addMinutes(now, settings.minAdvanceHours * 60);
  let minDate = getDateKeyInTimeZone(minStart, settings.timezone);
  const todayDate = getTodayDateKeyInTimeZone(settings.timezone, now);

  if (!settings.allowSameDayBooking) {
    const tomorrow = addDaysToDateKey(todayDate, 1);

    if (minDate < tomorrow) {
      minDate = tomorrow;
    }
  }

  const maxDate = addDaysToDateKey(todayDate, settings.maxDaysAhead);

  return {
    minStart,
    minDate,
    maxDate,
  };
}

function getWorkingRange(
  selectedDateKey: string,
  rules: ScheduleRuleRecord[],
  overrides: ScheduleOverrideRecord[],
  timezone: string
): TimeRange | null {
  const override = overrides.find((item) => item.date.slice(0, 10) === selectedDateKey);

  if (override) {
    if (!override.isWorkingDay || !override.startTime || !override.endTime) {
      return null;
    }

    const start = combineDateAndTime(selectedDateKey, override.startTime, timezone);
    const end = combineDateAndTime(selectedDateKey, override.endTime, timezone);

    if (!start || !end || start >= end) {
      return null;
    }

    return { start, end };
  }

  const rule = rules.find((item) => item.weekday === toWeekday(selectedDateKey));

  if (!rule || !rule.isEnabled) {
    return null;
  }

  const start = combineDateAndTime(selectedDateKey, rule.startTime, timezone);
  const end = combineDateAndTime(selectedDateKey, rule.endTime, timezone);

  if (!start || !end || start >= end) {
    return null;
  }

  return { start, end };
}

function buildBlockedRanges(
  rows: BlockedSlotRow[],
  selectedDateKey: string,
  timezone: string
): TimeRange[] {
  return rows
    .filter((row) => row.blocked_date.slice(0, 10) === selectedDateKey)
    .map((row) => {
      const start = combineDateAndTime(
        selectedDateKey,
        row.start_time.slice(0, 5),
        timezone
      );
      const end = combineDateAndTime(
        selectedDateKey,
        row.end_time.slice(0, 5),
        timezone
      );

      if (!start || !end || start >= end) {
        return null;
      }

      return { start, end };
    })
    .filter((item): item is TimeRange => item !== null);
}

function buildBusySessionRanges(
  rows: SessionRow[],
  selectedDateKey: string,
  bufferMinutes: number,
  timezone: string
): TimeRange[] {
  const dayStart = combineDateAndTime(selectedDateKey, "00:00", timezone);
  const dayEnd = combineDateAndTime(
    addDaysToDateKey(selectedDateKey, 1),
    "00:00",
    timezone
  );

  if (!dayStart || !dayEnd) {
    return [];
  }

  return rows
    .filter((row) => row.status !== "cancelled")
    .map((row) => {
      const start = ensureValidDate(new Date(row.scheduled_at));

      if (!start) {
        return null;
      }

      const durationMinutes = Number(row.duration_minutes);

      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return null;
      }

      const end = addMinutes(start, durationMinutes);
      const expandedRange = {
        start: addMinutes(start, -bufferMinutes),
        end: addMinutes(end, bufferMinutes),
      };

      if (!overlaps(expandedRange, { start: dayStart, end: dayEnd })) {
        return null;
      }

      return expandedRange;
    })
    .filter((item): item is TimeRange => item !== null);
}

function buildSlots(params: {
  selectedDateKey: string;
  serviceDurationMinutes: number;
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
  overrides: ScheduleOverrideRecord[];
  blockedRanges: TimeRange[];
  busySessionRanges: TimeRange[];
  now: Date;
}): PublicBookingSlot[] {
  const {
    selectedDateKey,
    serviceDurationMinutes,
    settings,
    rules,
    overrides,
    blockedRanges,
    busySessionRanges,
    now,
  } = params;

  const workingRange = getWorkingRange(
    selectedDateKey,
    rules,
    overrides,
    settings.timezone
  );

  if (!workingRange) {
    return [];
  }

  const bookingWindow = getBookingWindow(settings, now);
  const requiredStart = bookingWindow.minStart > now ? bookingWindow.minStart : now;
  const slotFitsUntil = addMinutes(
    workingRange.end,
    -(serviceDurationMinutes + settings.bufferMinutes)
  );

  if (workingRange.start > slotFitsUntil) {
    return [];
  }

  const slots: PublicBookingSlot[] = [];

  for (
    let candidate = new Date(workingRange.start);
    candidate <= slotFitsUntil;
    candidate = addMinutes(candidate, SLOT_STEP_MINUTES)
  ) {
    if (candidate < requiredStart) {
      continue;
    }

    const slotEnd = addMinutes(candidate, serviceDurationMinutes);
    const slotRange = { start: candidate, end: slotEnd };

    const intersectsBlocked = blockedRanges.some((range) => overlaps(slotRange, range));
    const intersectsBusySession = busySessionRanges.some((range) =>
      overlaps(slotRange, range)
    );

    if (intersectsBlocked || intersectsBusySession) {
      continue;
    }

    slots.push({
      startsAt: candidate.toISOString(),
      endsAt: slotEnd.toISOString(),
      startTime: getTimeKeyInTimeZone(candidate, settings.timezone),
      endTime: getTimeKeyInTimeZone(slotEnd, settings.timezone),
    });
  }

  return slots;
}

async function loadBaseData(db: Queryable): Promise<PublicBookingBaseData | null> {
  const [servicesResult, settingsResult, rulesResult, overridesResult, blockedSlotsResult] =
    await Promise.all([
      db.query<ServiceRow>(`
        SELECT
          id,
          title,
          description,
          price,
          duration_minutes
        FROM services
        WHERE is_active = TRUE
        ORDER BY created_at DESC
      `),
      db.query<SettingsRow>(`
        SELECT
          min_advance_hours,
          buffer_minutes,
          allow_same_day_booking,
          max_days_ahead,
          timezone
        FROM booking_settings
        WHERE id = 1
        LIMIT 1
      `),
      db.query<RuleRow>(`
        SELECT
          weekday,
          is_enabled,
          start_time,
          end_time
        FROM schedule_rules
        ORDER BY weekday ASC
      `),
      db.query<OverrideRow>(`
        SELECT
          override_date::text AS override_date,
          is_working_day,
          start_time,
          end_time
        FROM schedule_overrides
        ORDER BY override_date ASC
      `),
      db.query<BlockedSlotRow>(`
        SELECT
          blocked_date::text AS blocked_date,
          start_time,
          end_time
        FROM blocked_slots
        ORDER BY blocked_date ASC, start_time ASC
      `),
    ]);

  const settingsRow = settingsResult.rows[0];

  if (!settingsRow) {
    return null;
  }

  return {
    services: servicesResult.rows.map(mapService),
    settings: mapSettings(settingsRow),
    rules: rulesResult.rows.map(mapRule),
    overrides: overridesResult.rows.map(mapOverride),
    blockedSlotRows: blockedSlotsResult.rows,
  };
}

async function loadSessionRows(db: Queryable): Promise<SessionRow[]> {
  const sessionsResult = await db.query<SessionRow>(`
    SELECT
      scheduled_at,
      duration_minutes,
      status
    FROM sessions
    WHERE status <> 'cancelled'
  `);

  return sessionsResult.rows;
}

function buildMonthAvailability(params: {
  monthDate: Date;
  service: PublicBookingService;
  baseData: PublicBookingBaseData;
  bookingWindow: ReturnType<typeof getBookingWindow>;
  sessionRows: SessionRow[];
  now: Date;
}): PublicBookingMonthDayAvailability[] {
  const { monthDate, service, baseData, bookingWindow, sessionRows, now } = params;
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  const daysInMonth = new Date(
    Date.UTC(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  ).getUTCDate();
  const days: PublicBookingMonthDayAvailability[] = [];

  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
    const dateKey = `${monthKey}-${String(dayOfMonth).padStart(2, "0")}`;
    const isWithinBookingWindow =
      dateKey >= bookingWindow.minDate && dateKey <= bookingWindow.maxDate;

    if (!isWithinBookingWindow) {
      days.push({
        date: dateKey,
        state: "disabled",
      });
      continue;
    }

    const workingRange = getWorkingRange(
      dateKey,
      baseData.rules,
      baseData.overrides,
      baseData.settings.timezone
    );

    if (!workingRange) {
      days.push({
        date: dateKey,
        state: "disabled",
      });
      continue;
    }

    const blockedRanges = buildBlockedRanges(
      baseData.blockedSlotRows,
      dateKey,
      baseData.settings.timezone
    );
    const busySessionRanges = buildBusySessionRanges(
      sessionRows,
      dateKey,
      baseData.settings.bufferMinutes,
      baseData.settings.timezone
    );
    const slots = buildSlots({
      selectedDateKey: dateKey,
      serviceDurationMinutes: service.durationMinutes,
      settings: baseData.settings,
      rules: baseData.rules,
      overrides: baseData.overrides,
      blockedRanges,
      busySessionRanges,
      now,
    });

    days.push({
      date: dateKey,
      state: slots.length > 0 ? "available" : "unavailable",
      slotCount: slots.length > 0 ? slots.length : undefined,
    });
  }

  return days;
}

export async function getPublicBookingAvailabilityData(params: {
  serviceId: number | null;
  selectedDate: string | null;
  visibleMonth?: string | null;
  now?: Date;
  db?: Queryable;
}): Promise<GetPublicBookingAvailabilityDataResult> {
  const db = params.db ?? pool;
  const now = params.now ?? new Date();
  const baseData = await loadBaseData(db);

  if (!baseData) {
    return { ok: false, reason: "settings_missing" };
  }

  const bookingWindow = getBookingWindow(baseData.settings, now);
  const rawServiceId = params.serviceId;
  const rawDate = params.selectedDate;
  const rawVisibleMonth = params.visibleMonth ?? null;

  if (rawServiceId !== null && (!Number.isInteger(rawServiceId) || rawServiceId <= 0)) {
    return { ok: false, reason: "invalid_service" };
  }

  if (rawDate && !parseDateOnly(rawDate)) {
    return { ok: false, reason: "invalid_date" };
  }

  if (rawVisibleMonth && !parseMonthOnly(rawVisibleMonth)) {
    return { ok: false, reason: "invalid_month" };
  }

  let slots: PublicBookingSlot[] = [];
  let monthAvailability: PublicBookingMonthDayAvailability[] = [];
  let sessionRows: SessionRow[] | null = null;
  let selectedService: PublicBookingService | null = null;

  if (rawServiceId !== null) {
    selectedService =
      baseData.services.find((service) => service.id === rawServiceId) ?? null;

    if (!selectedService) {
      return { ok: false, reason: "service_not_found" };
    }
  }

  if (selectedService && (rawDate || rawVisibleMonth)) {
    sessionRows = await loadSessionRows(db);
  }

  if (selectedService && rawDate) {
    if (!parseDateOnly(rawDate)) {
      return { ok: false, reason: "invalid_date" };
    }

    const isWithinBookingWindow =
      rawDate >= bookingWindow.minDate && rawDate <= bookingWindow.maxDate;

    if (isWithinBookingWindow) {
      const blockedRanges = buildBlockedRanges(
        baseData.blockedSlotRows,
        rawDate,
        baseData.settings.timezone
      );
      const busySessionRanges = buildBusySessionRanges(
        sessionRows ?? [],
        rawDate,
        baseData.settings.bufferMinutes,
        baseData.settings.timezone
      );

      slots = buildSlots({
        selectedDateKey: rawDate,
        serviceDurationMinutes: selectedService.durationMinutes,
        settings: baseData.settings,
        rules: baseData.rules,
        overrides: baseData.overrides,
        blockedRanges,
        busySessionRanges,
        now,
      });
    }
  }

  if (selectedService && rawVisibleMonth) {
    const visibleMonthDate = parseMonthOnly(rawVisibleMonth);

    if (!visibleMonthDate) {
      return { ok: false, reason: "invalid_month" };
    }

    monthAvailability = buildMonthAvailability({
      monthDate: visibleMonthDate,
      service: selectedService,
      baseData,
      bookingWindow,
      sessionRows: sessionRows ?? [],
      now,
    });
  }

  return {
    ok: true,
    payload: {
      services: baseData.services,
      timezone: baseData.settings.timezone,
      selectedServiceId: rawServiceId,
      selectedDate: rawDate,
      visibleMonth: rawVisibleMonth,
      dateBounds: {
        min: bookingWindow.minDate,
        max: bookingWindow.maxDate,
      },
      slotStepMinutes: SLOT_STEP_MINUTES,
      slots,
      monthAvailability,
    },
  };
}

export async function validateBookableSlot(params: {
  serviceId: number;
  startsAt: string;
  now?: Date;
  db?: Queryable;
}): Promise<SlotValidationResult> {
  const db = params.db ?? pool;
  const now = params.now ?? new Date();
  const parsedStart = ensureValidDate(new Date(params.startsAt));

  if (!parsedStart) {
    return { ok: false, reason: "invalid_slot" };
  }

  const baseData = await loadBaseData(db);

  if (!baseData) {
    return { ok: false, reason: "settings_missing" };
  }

  const selectedDate = getDateKeyInTimeZone(parsedStart, baseData.settings.timezone);
  const availability = await getPublicBookingAvailabilityData({
    serviceId: params.serviceId,
    selectedDate,
    visibleMonth: selectedDate.slice(0, 7),
    now,
    db,
  });

  if (isPublicBookingAvailabilityError(availability)) {
    if (availability.reason === "settings_missing") {
      return { ok: false, reason: "settings_missing" };
    }

    if (availability.reason === "invalid_service") {
      return { ok: false, reason: "invalid_service" };
    }

    if (availability.reason === "invalid_date") {
      return { ok: false, reason: "invalid_date" };
    }

    return { ok: false, reason: "invalid_service" };
  }

  const service = availability.payload.services.find(
    (item) => item.id === params.serviceId
  );

  if (!service) {
    return { ok: false, reason: "invalid_service" };
  }

  const parsedSelectedDate = parseDateOnly(selectedDate);

  if (!parsedSelectedDate) {
    return { ok: false, reason: "invalid_date" };
  }

  const minDate = parseDateOnly(availability.payload.dateBounds.min);
  const maxDate = parseDateOnly(availability.payload.dateBounds.max);

  if (!minDate || !maxDate) {
    return { ok: false, reason: "settings_missing" };
  }

  if (parsedSelectedDate < minDate || parsedSelectedDate > maxDate) {
    return { ok: false, reason: "outside_booking_window" };
  }

  const slot = availability.payload.slots.find((item) => item.startsAt === params.startsAt);

  if (!slot) {
    return { ok: false, reason: "slot_unavailable" };
  }

  return {
    ok: true,
    service,
    slot,
    selectedDate,
    timezone: availability.payload.timezone,
  };
}
