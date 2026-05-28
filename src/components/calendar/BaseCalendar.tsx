import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  formatMonthTitle,
  getMonthGrid,
  getTodayDateKey,
  getWeekdayLabels,
  isDateAfter,
  isDateBefore,
  parseMonthKey,
  toMonthKey,
} from "./calendar.utils";
import type { BaseCalendarProps, CalendarDateMeta } from "./calendar.types";
import styles from "./BaseCalendar.module.css";

const ADMIN_HINT_PREVIEW_LENGTH = 32;

function getClassName(parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function getDefaultVisibleMonth(
  value: string | null | undefined,
  minDate: string | undefined,
  todayDate: string | undefined
): string {
  if (value) {
    return value.slice(0, 7);
  }

  if (minDate) {
    return minDate.slice(0, 7);
  }

  return (todayDate ?? getTodayDateKey()).slice(0, 7);
}

function getPreviewText(value: string, maxLength = ADMIN_HINT_PREVIEW_LENGTH): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function buildMetaMap(datesMeta: CalendarDateMeta[] | undefined): Map<string, CalendarDateMeta> {
  return new Map((datesMeta ?? []).map((item) => [item.date, item]));
}

export function BaseCalendar({
  value = null,
  onChange,
  visibleMonth,
  onVisibleMonthChange,
  todayDate,
  minDate,
  maxDate,
  disablePast = false,
  datesMeta,
  loading = false,
  error = null,
  mode = "single",
  locale = "en-US",
  weekStartsOn = 1,
  className,
  variant = "admin" as const,
}: BaseCalendarProps) {
  const resolvedVisibleMonth =
    visibleMonth ?? getDefaultVisibleMonth(value, minDate, todayDate);
  const monthGrid = getMonthGrid(resolvedVisibleMonth, weekStartsOn);
  const weekdayLabels = getWeekdayLabels(locale, weekStartsOn);
  const todayDateKey = todayDate ?? getTodayDateKey();
  const readOnly = mode === "readonly";
  const minAllowedDate = disablePast
    ? minDate && minDate > todayDateKey
      ? minDate
      : todayDateKey
    : minDate;
  const metaMap = buildMetaMap(datesMeta);
  const currentMonthDate = parseMonthKey(resolvedVisibleMonth);
  const minVisibleMonth = minAllowedDate?.slice(0, 7);
  const maxVisibleMonth = maxDate?.slice(0, 7);
  const previousMonthDisabled =
    !!minVisibleMonth && !!currentMonthDate && toMonthKey(addMonths(currentMonthDate, -1)) < minVisibleMonth;
  const nextMonthDisabled =
    !!maxVisibleMonth && !!currentMonthDate && toMonthKey(addMonths(currentMonthDate, 1)) > maxVisibleMonth;

  const handleMonthChange = (offset: number) => {
    if (!currentMonthDate || !onVisibleMonthChange) {
      return;
    }

    const nextMonth = toMonthKey(addMonths(currentMonthDate, offset));
    onVisibleMonthChange(nextMonth);
  };

  return (
    <div
      className={getClassName([
        styles.calendar,
        variant === "public" && styles.calendarPublic,
        readOnly && styles.calendarReadonly,
        className,
      ])}
    >
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{formatMonthTitle(resolvedVisibleMonth, locale)}</h3>
          <span className={styles.subtitle}>{value ?? resolvedVisibleMonth}</span>
        </div>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => handleMonthChange(-1)}
            aria-label="Previous month"
            disabled={!onVisibleMonthChange || previousMonthDisabled}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => handleMonthChange(1)}
            aria-label="Next month"
            disabled={!onVisibleMonthChange || nextMonthDisabled}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.weekdays}>
        {weekdayLabels.map((label) => (
          <div key={label} className={styles.weekday}>
            {label}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {monthGrid.map((day) => {
          const meta = metaMap.get(day.date);
          const metaState = meta?.state;
          const isSelected = value === day.date;
          const isToday = todayDateKey === day.date;
          const isOutsideMonth = !day.inCurrentMonth || metaState === "outsideMonth";
          const isUnavailable = metaState === "unavailable";
          const isDisabled =
            readOnly ||
            metaState === "disabled" ||
            metaState === "blocked" ||
            isUnavailable ||
            (minAllowedDate ? isDateBefore(day.date, minAllowedDate) : false) ||
            (maxDate ? isDateAfter(day.date, maxDate) : false);
          const hintPreview =
            meta?.hint && variant === "admin"
              ? getPreviewText(meta.hint)
              : meta?.hint;

          return (
            <button
              key={day.date}
              type="button"
              className={getClassName([
                styles.day,
                readOnly && styles.dayReadonly,
                isOutsideMonth && styles.dayOutsideMonth,
                isDisabled && styles.dayDisabled,
                isToday && styles.dayToday,
                metaState === "available" && styles.dayAvailable,
                metaState === "unavailable" && styles.dayUnavailable,
                isSelected && styles.daySelected,
              ])}
              onClick={() => {
                if (!isDisabled && onChange) {
                  onChange(day.date);
                }
              }}
              disabled={isDisabled}
              aria-pressed={isSelected}
              title={meta?.hint}
            >
              <div className={styles.dayTop}>
                <span className={styles.dayNumber}>{day.date.slice(8, 10)}</span>
                {meta?.badge ? <span className={styles.badge}>{meta.badge}</span> : null}
              </div>

              {meta?.label ? <div className={styles.label}>{meta.label}</div> : null}
              {meta?.hint ? <div className={styles.hint}>{hintPreview}</div> : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className={styles.overlay} aria-live="polite" aria-busy="true">
          <div className={styles.loadingChip}>
            <span className={styles.spinner} />
            <span>Loading calendar</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}