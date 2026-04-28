export type CalendarDayState =
  | "default"
  | "today"
  | "selected"
  | "disabled"
  | "outsideMonth"
  | "available"
  | "unavailable"
  | "partiallyAvailable"
  | "blocked"
  | "hasEvents";

export type CalendarDateMeta = {
  date: string;
  state?: CalendarDayState;
  label?: string;
  hint?: string;
  badge?: string;
};

export type BaseCalendarMode = "single" | "readonly";

export type BaseCalendarProps = {
  value?: string | null;
  onChange?: (date: string) => void;
  visibleMonth?: string;
  onVisibleMonthChange?: (month: string) => void;
  minDate?: string;
  maxDate?: string;
  disablePast?: boolean;
  datesMeta?: CalendarDateMeta[];
  loading?: boolean;
  error?: string | null;
  mode?: BaseCalendarMode;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  variant?: "public" | "admin";
};
