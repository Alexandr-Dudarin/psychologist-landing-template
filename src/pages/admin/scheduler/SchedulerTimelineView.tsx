import type { KeyboardEvent } from "react";

import styles from "./SchedulerTimelineView.module.css";
import {
  formatOverlayPosition,
  getDayDetail,
  getDayWorkingHours,
  getOverlayDetail,
  getWeekSummaryLabel,
} from "./premiumScheduler.helpers";
import { SchedulerEventCard } from "./SchedulerEventCard";
import type { SchedulerDetail } from "./premiumScheduler.helpers";
import type {
  SchedulerDaySummary,
  SchedulerOverlayItem,
  SchedulerViewMode,
} from "./premiumScheduler.shared";

const MINUTES_IN_HOUR = 60;
const GRID_START_HOUR = 7;

type SchedulerTimelineViewProps = {
  daySummaries: SchedulerDaySummary[];
  headerHeight: number;
  hours: Array<{ hour: number; label: string }>;
  overlayItems: SchedulerOverlayItem[];
  rowHeight: number;
  viewMode: Extract<SchedulerViewMode, "week" | "day">;
  onDayDetail: (detail: SchedulerDetail) => void;
  onEventDetail: (detail: SchedulerDetail) => void;
};

export function SchedulerTimelineView({
  daySummaries,
  headerHeight,
  hours,
  overlayItems,
  rowHeight,
  viewMode,
  onDayDetail,
  onEventDetail,
}: SchedulerTimelineViewProps) {
  return (
    <div
      className={viewMode === "week" ? styles.weekFrame : styles.dayFrame}
      style={{
        ["--scheduler-row-height" as string]: `${rowHeight}px`,
        ["--scheduler-header-height" as string]: `${headerHeight}px`,
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
                      {viewMode === "week" ? day.shortLabel : day.fullLabel}
                    </div>
                    <div className={styles.dayHeaderCaption}>
                      {viewMode === "week"
                        ? getWeekSummaryLabel(day)
                        : `${day.workingLabel}. ${getDayWorkingHours(day)}`}
                    </div>
                  </div>

                  <span className={styles.detailToggle} aria-hidden="true">
                    {viewMode === "week" ? "День" : "Открыть детали дня"}
                  </span>
                </div>

                <div className={styles.dayMeta}>
                  <span className={styles.metaBadge}>
                    Сессии: {day.sessionsCount}
                  </span>
                  {day.blockedCount > 0 ? (
                    <span className={styles.metaBadge}>
                      Блоки: {day.blockedCount}
                    </span>
                  ) : null}
                  <span className={styles.metaBadge}>
                    {viewMode === "week"
                      ? day.loadCompactLabel
                      : day.compactWorkingLabel}
                  </span>
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
                    {day.isOverride &&
                    day.overrideNotePreview !== "Без заметки" ? (
                      <span className={styles.dayInsightEmphasis}>
                        Исключение: {day.overrideNotePreview}
                      </span>
                    ) : (
                      <span className={styles.dayInsightMuted}>
                        {day.loadLabel}
                      </span>
                    )}
                  </div>
                ) : null}
              </header>

              <div className={styles.gridBody}>
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