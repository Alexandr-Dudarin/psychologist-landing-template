/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingService,
  PublicBookingSlot,
} from "../../../src/types/booking";
import type {
  BookingSettingsRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
} from "../../../src/types/schedule";

const SLOT_STEP_MINUTES = 30;

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

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function ensureValidDate(date: Date): Date | null {
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateOnly(value: string): Date | null {
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

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatDateTimeLocal(date: Date): string {
  return `${formatDateOnly(date)}T${formatTime(date)}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function overlaps(first: TimeRange, second: TimeRange): boolean {
  return first.start < second.end && second.start < first.end;
}

function toWeekday(date: Date): number {
  const weekday = date.getDay();

  return weekday === 0 ? 7 : weekday;
}

function combineDateAndTime(date: Date, time: string): Date | null {
  const timeParts = parseTimeParts(time);

  if (!timeParts) {
    return null;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    timeParts.hours,
    timeParts.minutes,
    0,
    0
  );
}

function mapSettings(row: SettingsRow): BookingSettingsRecord {
  return {
    minAdvanceHours: Number(row.min_advance_hours),
    bufferMinutes: Number(row.buffer_minutes),
    allowSameDayBooking: row.allow_same_day_booking,
    maxDaysAhead: Number(row.max_days_ahead),
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

function getBookingWindow(settings: BookingSettingsRecord, now: Date) {
  const minStart = addMinutes(now, settings.minAdvanceHours * 60);
  let minDate = startOfDay(minStart);

  if (!settings.allowSameDayBooking) {
    const tomorrow = addDays(startOfDay(now), 1);

    if (minDate < tomorrow) {
      minDate = tomorrow;
    }
  }

  const maxDate = addDays(startOfDay(now), settings.maxDaysAhead);

  return {
    minStart,
    minDate,
    maxDate,
  };
}

function getWorkingRange(
  selectedDate: Date,
  rules: ScheduleRuleRecord[],
  overrides: ScheduleOverrideRecord[]
): TimeRange | null {
  const selectedDateKey = formatDateOnly(selectedDate);
  const override = overrides.find((item) => item.date.slice(0, 10) === selectedDateKey);

  if (override) {
    if (!override.isWorkingDay || !override.startTime || !override.endTime) {
      return null;
    }

    const start = combineDateAndTime(selectedDate, override.startTime);
    const end = combineDateAndTime(selectedDate, override.endTime);

    if (!start || !end || start >= end) {
      return null;
    }

    return { start, end };
  }

  const rule = rules.find((item) => item.weekday === toWeekday(selectedDate));

  if (!rule || !rule.isEnabled) {
    return null;
  }

  const start = combineDateAndTime(selectedDate, rule.startTime);
  const end = combineDateAndTime(selectedDate, rule.endTime);

  if (!start || !end || start >= end) {
    return null;
  }

  return { start, end };
}

function buildBlockedRanges(rows: BlockedSlotRow[], selectedDate: Date): TimeRange[] {
  const selectedDateKey = formatDateOnly(selectedDate);

  return rows
    .filter((row) => row.blocked_date.slice(0, 10) === selectedDateKey)
    .map((row) => {
      const start = combineDateAndTime(selectedDate, row.start_time.slice(0, 5));
      const end = combineDateAndTime(selectedDate, row.end_time.slice(0, 5));

      if (!start || !end || start >= end) {
        return null;
      }

      return { start, end };
    })
    .filter((item): item is TimeRange => item !== null);
}

function buildBusySessionRanges(
  rows: SessionRow[],
  selectedDate: Date,
  bufferMinutes: number
): TimeRange[] {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = addDays(dayStart, 1);

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
  selectedDate: Date;
  serviceDurationMinutes: number;
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
  overrides: ScheduleOverrideRecord[];
  blockedRanges: TimeRange[];
  busySessionRanges: TimeRange[];
  now: Date;
}): PublicBookingSlot[] {
  const {
    selectedDate,
    serviceDurationMinutes,
    settings,
    rules,
    overrides,
    blockedRanges,
    busySessionRanges,
    now,
  } = params;

  const workingRange = getWorkingRange(selectedDate, rules, overrides);

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
      startsAt: formatDateTimeLocal(candidate),
      endsAt: formatDateTimeLocal(slotEnd),
      startTime: formatTime(candidate),
      endTime: formatTime(slotEnd),
    });
  }

  return slots;
}


export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawServiceId = getSingleQueryValue(req.query?.serviceId).trim();
  const rawDate = getSingleQueryValue(req.query?.date).trim();
  const selectedServiceId = rawServiceId ? Number(rawServiceId) : null;
  const selectedDate = rawDate || null;

  if (rawServiceId && (!Number.isInteger(selectedServiceId) || Number(selectedServiceId) <= 0)) {
    return res.status(400).json({ error: "Некорректная услуга" });
  }

  if (rawDate && !parseDateOnly(rawDate)) {
    return res.status(400).json({ error: "Некорректная дата" });
  }

  try {

    const [servicesResult, settingsResult, rulesResult, overridesResult, blockedSlotsResult] =
      await Promise.all([
        pool.query<ServiceRow>(`
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
        pool.query<SettingsRow>(`
          SELECT
            min_advance_hours,
            buffer_minutes,
            allow_same_day_booking,
            max_days_ahead
          FROM booking_settings
          WHERE id = 1
          LIMIT 1
        `),
        pool.query<RuleRow>(`
          SELECT
            weekday,
            is_enabled,
            start_time,
            end_time
          FROM schedule_rules
          ORDER BY weekday ASC
        `),
        pool.query<OverrideRow>(`
          SELECT
            override_date::text AS override_date,
            is_working_day,
            start_time,
            end_time
          FROM schedule_overrides
          ORDER BY override_date ASC
        `),
        pool.query<BlockedSlotRow>(`
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
      return res.status(500).json({ error: "Не удалось загрузить настройки записи" });
    }

    const services = servicesResult.rows.map(mapService);
    const settings = mapSettings(settingsRow);
    const rules = rulesResult.rows.map(mapRule);
    const overrides = overridesResult.rows.map(mapOverride);
    const now = new Date();
    const bookingWindow = getBookingWindow(settings, now);

    let slots: PublicBookingSlot[] = [];

    if (selectedServiceId !== null && selectedDate) {
      const selectedService = services.find((service) => service.id === selectedServiceId);

      if (!selectedService) {
        return res.status(404).json({ error: "Услуга не найдена или отключена" });
      }

      const selectedDateObject = parseDateOnly(selectedDate);

      if (!selectedDateObject) {
        return res.status(400).json({ error: "Некорректная дата" });
      }

      const isWithinBookingWindow =
        selectedDateObject >= bookingWindow.minDate && selectedDateObject <= bookingWindow.maxDate;

      if (isWithinBookingWindow) {
        const sessionsResult = await pool.query<SessionRow>(`
          SELECT
            scheduled_at,
            duration_minutes,
            status
          FROM sessions
          WHERE status <> 'cancelled'
        `);

        const blockedRanges = buildBlockedRanges(blockedSlotsResult.rows, selectedDateObject);
        const busySessionRanges = buildBusySessionRanges(
          sessionsResult.rows,
          selectedDateObject,
          settings.bufferMinutes
        );

        slots = buildSlots({
          selectedDate: selectedDateObject,
          serviceDurationMinutes: selectedService.durationMinutes,
          settings,
          rules,
          overrides,
          blockedRanges,
          busySessionRanges,
          now,
        });
      }
    }

    const payload: PublicBookingAvailabilityResponse = {
      services,
      selectedServiceId,
      selectedDate,
      dateBounds: {
        min: formatDateOnly(bookingWindow.minDate),
        max: formatDateOnly(bookingWindow.maxDate),
      },
      slotStepMinutes: SLOT_STEP_MINUTES,
      slots,
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Public booking availability error:", error);
    return res.status(500).json({ error: "Не удалось загрузить доступные слоты" });
  }
}

