const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseDateKey(dateKey: string): Date | null {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function parseMonthKey(monthKey: string): Date | null {
  if (!MONTH_KEY_PATTERN.test(monthKey)) {
    return null;
  }

  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

export function toDateKey(date: Date): string {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-");
}

export function toMonthKey(date: Date): string {
  return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1)].join("-");
}

export function getTodayDateKey(): string {
  return toDateKey(new Date());
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

export function startOfWeek(date: Date, weekStartsOn: number): Date {
  const currentDay = date.getUTCDay();
  const diff = (currentDay - weekStartsOn + 7) % 7;
  return new Date(date.getTime() - diff * MS_IN_DAY);
}

export function endOfWeek(date: Date, weekStartsOn: number): Date {
  const start = startOfWeek(date, weekStartsOn);
  return new Date(start.getTime() + 6 * MS_IN_DAY);
}

export function getMonthGrid(
  monthKey: string,
  weekStartsOn: number
): Array<{
  date: string;
  inCurrentMonth: boolean;
}> {
  const monthDate = parseMonthKey(monthKey);

  if (!monthDate) {
    return [];
  }

  const monthStart = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1)
  );
  const monthEnd = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)
  );
  const gridStart = startOfWeek(monthStart, weekStartsOn);
  const gridEnd = endOfWeek(monthEnd, weekStartsOn);
  const grid: Array<{ date: string; inCurrentMonth: boolean }> = [];

  for (
    let cursor = gridStart;
    cursor.getTime() <= gridEnd.getTime();
    cursor = new Date(cursor.getTime() + MS_IN_DAY)
  ) {
    grid.push({
      date: toDateKey(cursor),
      inCurrentMonth: cursor.getUTCMonth() === monthStart.getUTCMonth(),
    });
  }

  return grid;
}

export function getWeekdayLabels(locale: string, weekStartsOn: number): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const baseWeekStart = new Date(Date.UTC(2024, 0, 7 + weekStartsOn));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(baseWeekStart.getTime() + index * MS_IN_DAY);
    return formatter.format(day);
  });
}

export function formatMonthTitle(monthKey: string, locale: string): string {
  const monthDate = parseMonthKey(monthKey);

  if (!monthDate) {
    return monthKey;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(monthDate);
}

export function isDateBefore(dateKey: string, compareWith: string): boolean {
  return dateKey < compareWith;
}

export function isDateAfter(dateKey: string, compareWith: string): boolean {
  return dateKey > compareWith;
}
