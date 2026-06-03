import {
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

import styles from "./SchedulerTimelineView.module.css";
import {
  formatOverlayPosition,
  getDayDetail,
  getDayWorkingHours,
  getOverlayDetail,
} from "./premiumScheduler.helpers";
import { SchedulerEventCard } from "./SchedulerEventCard";
import type {
  SchedulerDetail,
  SchedulerEmptySlotSelection,
} from "./premiumScheduler.helpers";
import type {
  SchedulerDaySummary,
  SchedulerOverlayItem,
  SchedulerViewMode,
} from "./premiumScheduler.shared";

const MINUTES_IN_HOUR = 60;
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 23;
const SLOT_STEP_MINUTES = 30;
const EMPTY_SLOT_DEFAULT_DURATION_MINUTES = 60;
const MOBILE_LONG_PRESS_MS = 560;
const MOBILE_MOVE_CANCEL_THRESHOLD = 10;
const DAY_VIEW_COMPACT_HEADER_HEIGHT = 112;
const DAY_VIEW_OVERRIDE_HEADER_HEIGHT = 140;

type SchedulerTimelineViewProps = {
  daySummaries: SchedulerDaySummary[];
  headerHeight: number;
  hours: Array<{ hour: number; label: string }>;
  overlayItems: SchedulerOverlayItem[];
  rowHeight: number;
  viewMode: Extract<SchedulerViewMode, "week" | "day">;
  onDayDetail: (detail: SchedulerDetail) => void;
  onEmptySlotSelect: (selection: SchedulerEmptySlotSelection) => void;
  onEventDetail: (detail: SchedulerDetail) => void;
};

function getCompactWeekDayParts(shortLabel: string): {
  dayNumber: string;
  weekday: string;
} {
  const [weekdayPart = "", datePart = ""] = shortLabel
    .split(",")
    .map((part) => part.trim());

  const dayNumber =
    datePart.match(/\d{1,2}/)?.[0] ??
    shortLabel.match(/\d{1,2}/)?.[0] ??
    datePart ??
    shortLabel;

  const weekday =
    weekdayPart ||
    shortLabel
      .replace(dayNumber, "")
      .replace(",", "")
      .trim();

  return {
    dayNumber,
    weekday,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function toTimeLabel(minutesFromStartOfDay: number): string {
  const minutes = clamp(minutesFromStartOfDay, 0, GRID_END_HOUR * MINUTES_IN_HOUR);
  const hours = Math.floor(minutes / MINUTES_IN_HOUR);
  const minutesPart = minutes % MINUTES_IN_HOUR;

  return `${String(hours).padStart(2, "0")}:${String(minutesPart).padStart(
    2,
    "0"
  )}`;
}

function shouldUseLongPressInteraction(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
}

function getEmptySlotSelection(params: {
  clientY: number;
  dateKey: string;
  gridBody: HTMLDivElement;
  rowHeight: number;
}): SchedulerEmptySlotSelection {
  const rect = params.gridBody.getBoundingClientRect();
  const offsetY = clamp(params.clientY - rect.top, 0, rect.height);
  const rawMinutes =
    GRID_START_HOUR * MINUTES_IN_HOUR +
    (offsetY / params.rowHeight) * MINUTES_IN_HOUR;
  const roundedStartMinutes = roundToStep(rawMinutes, SLOT_STEP_MINUTES);
  const minStartMinutes = GRID_START_HOUR * MINUTES_IN_HOUR;
  const maxStartMinutes = GRID_END_HOUR * MINUTES_IN_HOUR - SLOT_STEP_MINUTES;
  const startMinutes = clamp(
    roundedStartMinutes,
    minStartMinutes,
    maxStartMinutes
  );
  const endMinutes = Math.min(
    startMinutes + EMPTY_SLOT_DEFAULT_DURATION_MINUTES,
    GRID_END_HOUR * MINUTES_IN_HOUR
  );

  return {
    dateKey: params.dateKey,
    startTime: toTimeLabel(startMinutes),
    endTime: toTimeLabel(Math.max(endMinutes, startMinutes + SLOT_STEP_MINUTES)),
  };
}

export function SchedulerTimelineView({
  daySummaries,
  headerHeight,
  hours,
  overlayItems,
  rowHeight,
  viewMode,
  onDayDetail,
  onEmptySlotSelect,
  onEventDetail,
}: SchedulerTimelineViewProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressHandledRef = useRef(false);

  const hasDayOverrideInsight =
    viewMode === "day" &&
    daySummaries.some(
      (day) => day.isOverride && day.overrideNotePreview !== "Без заметки"
    );

  const effectiveHeaderHeight =
    viewMode === "day"
      ? Math.max(
          headerHeight,
          hasDayOverrideInsight
            ? DAY_VIEW_OVERRIDE_HEADER_HEIGHT
            : DAY_VIEW_COMPACT_HEADER_HEIGHT
        )
      : headerHeight;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openEmptySlotAction = (
    day: SchedulerDaySummary,
    gridBody: HTMLDivElement,
    clientY: number
  ) => {
    onEmptySlotSelect(
      getEmptySlotSelection({
        clientY,
        dateKey: day.dateKey,
        gridBody,
        rowHeight,
      })
    );
  };

  const handleGridClick = (
    event: MouseEvent<HTMLDivElement>,
    day: SchedulerDaySummary
  ) => {
    if (shouldUseLongPressInteraction()) {
      if (longPressHandledRef.current) {
        longPressHandledRef.current = false;
      }

      return;
    }

    openEmptySlotAction(day, event.currentTarget, event.clientY);
  };

  const handleGridPointerDown = (
    event: PointerEvent<HTMLDivElement>,
    day: SchedulerDaySummary
  ) => {
    if (!shouldUseLongPressInteraction()) {
      return;
    }

    clearLongPressTimer();
    longPressHandledRef.current = false;
    longPressStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    const gridBody = event.currentTarget;
    const clientY = event.clientY;

    longPressTimerRef.current = window.setTimeout(() => {
      longPressHandledRef.current = true;
      openEmptySlotAction(day, gridBody, clientY);
      clearLongPressTimer();
    }, MOBILE_LONG_PRESS_MS);
  };

  const handleGridPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!longPressStartRef.current) {
      return;
    }

    const distanceX = Math.abs(event.clientX - longPressStartRef.current.x);
    const distanceY = Math.abs(event.clientY - longPressStartRef.current.y);

    if (
      distanceX > MOBILE_MOVE_CANCEL_THRESHOLD ||
      distanceY > MOBILE_MOVE_CANCEL_THRESHOLD
    ) {
      clearLongPressTimer();
    }
  };

  const handleGridPointerEnd = () => {
    clearLongPressTimer();
    longPressStartRef.current = null;
  };

  return (
    <div
      className={viewMode === "week" ? styles.weekFrame : styles.dayFrame}
      style={{
        ["--scheduler-row-height" as string]: `${rowHeight}px`,
        ["--scheduler-header-height" as string]: `${effectiveHeaderHeight}px`,
        ["--scheduler-hours-count" as string]: String(hours.length),
      }}
    >
      <div className={styles.timeColumn}>
        <div className={styles.timeHeader}>Время</div>
        {hours.map((hour) => (
          <div key={hour.hour} className={styles.timeCell}>
            {hour.label}
          </div>
        ))}
      </div>

      <div
        className={`${styles.columns} ${
          viewMode === "week" ? styles.columnsWeek : styles.columnsDay
        }`}
      >
        {daySummaries.map((day) => {
          const dayItems = overlayItems.filter(
            (item) => item.dayKey === day.dateKey
          );
          const openDayDetail = () => onDayDetail(getDayDetail(day));
          const compactWeekDay = getCompactWeekDayParts(day.shortLabel);
          const overrideInsight =
            day.isOverride && day.overrideNotePreview !== "Без заметки"
              ? `Исключение: ${day.overrideNotePreview}`
              : null;

          const handleDayHeaderKeyDown = (
            event: KeyboardEvent<HTMLElement>
          ) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDayDetail();
            }
          };

          return (
            <section
              key={day.dateKey}
              className={`${styles.dayColumn} ${
                day.workingStateTone === "override-working"
                  ? styles.dayColumnOverride
                  : day.workingStateTone === "override-day-off"
                    ? styles.dayColumnOverrideOff
                    : day.workingStateTone === "day-off"
                      ? styles.dayColumnDayOff
                      : ""
              } ${viewMode === "day" ? styles.dayColumnExpanded : ""}`}
            >
              <header
                role="button"
                tabIndex={0}
                aria-label={`Открыть детали дня: ${day.fullLabel}`}
                className={`${styles.dayHeader} ${
                  styles.dayHeaderInteractive
                } ${
                  viewMode === "week"
                    ? styles.dayHeaderWeek
                    : styles.dayHeaderDay
                }`}
                onClick={openDayDetail}
                onKeyDown={handleDayHeaderKeyDown}
              >
                <div className={styles.dayHeaderTop}>
                  <div className={styles.dayTitleGroup}>
                    <div className={styles.dayTitle}>
                      {viewMode === "week" ? (
                        <>
                          <span className={styles.dayTitleRegular}>
                            {day.shortLabel}
                          </span>
                          <span
                            className={styles.dayTitleCompact}
                            aria-label={day.shortLabel}
                          >
                            <span className={styles.dayTitleCompactDate}>
                              {compactWeekDay.dayNumber}
                            </span>
                            <span className={styles.dayTitleCompactWeekday}>
                              {compactWeekDay.weekday}
                            </span>
                          </span>
                        </>
                      ) : (
                        day.fullLabel
                      )}
                    </div>

                    {viewMode === "day" ? (
                      <div className={styles.dayHeaderCaption}>
                        {`${day.workingLabel}. ${getDayWorkingHours(day)}`}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`${styles.dayMeta} ${
                    viewMode === "day"
                      ? styles.dayMetaDay
                      : styles.dayMetaWeek
                  }`}
                >
                  <span
                    className={`${styles.metaBadge} ${
                      viewMode === "day" ? styles.sessionsMetaBadge : ""
                    }`}
                  >
                    Сессии: {day.sessionsCount}
                  </span>

                  {viewMode === "day" && day.blockedCount > 0 ? (
                    <span className={styles.metaBadge}>
                      Блоки: {day.blockedCount}
                    </span>
                  ) : null}

                  {viewMode === "day" ? (
                    <span className={styles.metaBadge}>
                      {day.compactWorkingLabel}
                    </span>
                  ) : null}
                </div>

                {viewMode === "day" ? (
                  <div className={styles.dayInsightRow}>
                    <span className={styles.dayInsight}>
                      Рабочее окно: {getDayWorkingHours(day)}
                    </span>

                    {overrideInsight ? (
                      <span
                        className={styles.dayInsightEmphasis}
                        title={overrideInsight}
                      >
                        {overrideInsight}
                      </span>
                    ) : (
                      <span className={styles.dayInsightMuted}>
                        {day.loadLabel}
                      </span>
                    )}
                  </div>
                ) : null}
              </header>

              <div
                className={styles.gridBody}
                onClick={(event) => handleGridClick(event, day)}
                onPointerCancel={handleGridPointerEnd}
                onPointerDown={(event) => handleGridPointerDown(event, day)}
                onPointerLeave={handleGridPointerEnd}
                onPointerMove={handleGridPointerMove}
                onPointerUp={handleGridPointerEnd}
              >
                {day.workStartMinutes !== null &&
                day.workEndMinutes !== null &&
                day.isWorking ? (
                  <div
                    className={styles.workingHoursBand}
                    style={{
                      top: `${
                        ((day.workStartMinutes -
                          GRID_START_HOUR * MINUTES_IN_HOUR) /
                          MINUTES_IN_HOUR) *
                        rowHeight
                      }px`,
                      height: `${
                        ((day.workEndMinutes - day.workStartMinutes) /
                          MINUTES_IN_HOUR) *
                        rowHeight
                      }px`,
                    }}
                  />
                ) : null}

                {day.nonWorkingRanges.map((range) => {
                  const { top, height } = formatOverlayPosition(
                    range.startMinutes,
                    range.durationMinutes,
                    rowHeight
                  );

                  return (
                    <div
                      key={range.id}
                      className={
                        range.tone === "day-off"
                          ? styles.dayOffOverlay
                          : styles.nonWorkingOverlay
                      }
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                    />
                  );
                })}

                {dayItems.map((item) => {
                  const { top, height } = formatOverlayPosition(
                    item.startMinutes,
                    item.durationMinutes,
                    rowHeight
                  );

                  return (
                    <SchedulerEventCard
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      top={top}
                      height={height}
                      onClick={() => onEventDetail(getOverlayDetail(item))}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}