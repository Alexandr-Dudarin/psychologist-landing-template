type DateParts = {
  year: number;
  month: number;
  day: number;
};

type TimeParts = {
  hour: number;
  minute: number;
};

type DateTimeParts = DateParts & TimeParts;

function parseDateParts(dateKey: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return { year, month, day };
}

function parseTimeParts(time: string): TimeParts | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

function parseDateTimeLocalParts(value: string): DateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function toDateKey(parts: DateParts): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(
    2,
    "0"
  )}-${String(parts.day).padStart(2, "0")}`;
}

function toTimeKey(parts: TimeParts): string {
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(
    2,
    "0"
  )}`;
}

function getFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    ...options,
  });
}

export function getTimeZoneDateTimeParts(
  value: Date | string,
  timeZone: string
): DateTimeParts | null {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = getFormatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

export function getDateKeyInTimeZone(value: Date | string, timeZone: string): string {
  const parts = getTimeZoneDateTimeParts(value, timeZone);

  return parts ? toDateKey(parts) : "";
}

export function getTimeKeyInTimeZone(value: Date | string, timeZone: string): string {
  const parts = getTimeZoneDateTimeParts(value, timeZone);

  return parts ? toTimeKey(parts) : "";
}

export function getMinutesSinceStartOfDayInTimeZone(
  value: Date | string,
  timeZone: string
): number {
  const parts = getTimeZoneDateTimeParts(value, timeZone);

  if (!parts) {
    return 0;
  }

  return parts.hour * 60 + parts.minute;
}

export function getTodayDateKeyInTimeZone(timeZone: string, now = new Date()): string {
  return getDateKeyInTimeZone(now, timeZone);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const parts = parseDateParts(dateKey);

  if (!parts) {
    return dateKey;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function zonedDateTimeToUtcDate(
  dateKey: string,
  time: string,
  timeZone: string
): Date | null {
  const dateParts = parseDateParts(dateKey);
  const timeParts = parseTimeParts(time);

  if (!dateParts || !timeParts) {
    return null;
  }

  const targetUtcValue = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute
  );

  let timestamp = targetUtcValue;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const actualParts = getTimeZoneDateTimeParts(new Date(timestamp), timeZone);

    if (!actualParts) {
      return null;
    }

    const actualUtcValue = Date.UTC(
      actualParts.year,
      actualParts.month - 1,
      actualParts.day,
      actualParts.hour,
      actualParts.minute
    );

    const diff = targetUtcValue - actualUtcValue;

    if (diff === 0) {
      return new Date(timestamp);
    }

    timestamp += diff;
  }

  const resolved = new Date(timestamp);
  const resolvedParts = getTimeZoneDateTimeParts(resolved, timeZone);

  if (
    !resolvedParts ||
    resolvedParts.year !== dateParts.year ||
    resolvedParts.month !== dateParts.month ||
    resolvedParts.day !== dateParts.day ||
    resolvedParts.hour !== timeParts.hour ||
    resolvedParts.minute !== timeParts.minute
  ) {
    return null;
  }

  return resolved;
}

export function dateTimeLocalInTimeZoneToIso(
  value: string,
  timeZone: string
): string | null {
  const parts = parseDateTimeLocalParts(value);

  if (!parts) {
    return null;
  }

  const resolved = zonedDateTimeToUtcDate(
    toDateKey(parts),
    toTimeKey(parts),
    timeZone
  );

  return resolved ? resolved.toISOString() : null;
}

export function toDateTimeLocalValueInTimeZone(
  value: string,
  timeZone: string
): string {
  const parts = getTimeZoneDateTimeParts(value, timeZone);

  if (!parts) {
    return "";
  }

  return `${toDateKey(parts)}T${toTimeKey(parts)}`;
}

export function getNowDateTimeLocalValueInTimeZone(
  timeZone: string,
  now = new Date()
): string {
  const parts = getTimeZoneDateTimeParts(now, timeZone);

  if (!parts) {
    return "";
  }

  return `${toDateKey(parts)}T${toTimeKey(parts)}`;
}

export function formatDateTimeLocalSummaryInTimeZone(
  value: string,
  timeZone: string,
  locale = "ru-RU"
): string {
  const iso = dateTimeLocalInTimeZoneToIso(value, timeZone);

  if (!iso) {
    return "Дата и время пока не выбраны";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function isPastDateTimeLocalInTimeZone(
  value: string,
  timeZone: string,
  now = new Date()
): boolean {
  const iso = dateTimeLocalInTimeZoneToIso(value, timeZone);

  if (!iso) {
    return false;
  }

  return new Date(iso).getTime() < now.getTime();
}
