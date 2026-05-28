import { useEffect, useRef } from "react";

import styles from "./SchedulerMonthView.module.css";
import type { SchedulerDetail } from "./premiumScheduler.helpers";
import type { SchedulerMonthCellSummary } from "./premiumScheduler.shared";

type SchedulerMonthViewProps = {
  monthSummary: SchedulerMonthCellSummary[];
  targetDateKey?: string;
  onSelectDay: (detail: SchedulerDetail | null) => void;
  resolveDayDetail: (dateKey: string) => SchedulerDetail | null;
};

export function SchedulerMonthView({
  monthSummary,
  targetDateKey,
  onSelectDay,
  resolveDayDetail,
}: SchedulerMonthViewProps) {
  const targetCellRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const targetCell = targetCellRef.current;

    if (!targetCell || typeof window === "undefined") {
      return;
    }

    const isNarrowViewport = window.matchMedia("(max-width: 820px)").matches;

    if (!isNarrowViewport) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      targetCell.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [monthSummary, targetDateKey]);

  return (
    <div className={styles.monthGrid}>
      {monthSummary.map((day) => {
        const isTargetDay = day.date === targetDateKey;

        return (
          <button
            key={day.date}
            ref={isTargetDay ? targetCellRef : undefined}
            type="button"
            aria-current={isTargetDay ? "date" : undefined}
            className={`${styles.monthCell} ${
              !day.inCurrentMonth ? styles.monthCellMuted : ""
            } ${isTargetDay ? styles.monthCellCurrent : ""} ${
              day.workingStateTone === "override-working"
                ? styles.monthCellOverride
                : day.workingStateTone === "override-day-off"
                  ? styles.monthCellDayOff
                  : day.workingStateTone === "day-off"
                    ? styles.monthCellMutedState
                    : ""
            }`}
            onClick={() => onSelectDay(resolveDayDetail(day.date))}
          >
            <div className={styles.monthCellTop}>
              <span className={styles.monthCellDate}>
                {day.date.slice(8, 10)}
              </span>
              <div className={styles.monthCellBadges}>
                {day.sessionsCount > 0 ? (
                  <span className={styles.monthChip}>
                    Сессии: {day.sessionsCount}
                  </span>
                ) : null}
                {day.blockedCount > 0 ? (
                  <span className={styles.monthChip}>
                    Блоки: {day.blockedCount}
                  </span>
                ) : null}
                <span
                  className={`${styles.monthLoadCue} ${
                    day.loadLevel === "busy"
                      ? styles.monthLoadBusy
                      : day.loadLevel === "medium"
                        ? styles.monthLoadMedium
                        : day.loadLevel === "light"
                          ? styles.monthLoadLight
                          : styles.monthLoadEmpty
                  }`}
                >
                  {day.loadLevel === "busy"
                    ? "Плотный день"
                    : day.loadLevel === "medium"
                      ? "Средняя загрузка"
                      : day.loadLevel === "light"
                        ? "Лёгкая загрузка"
                        : "Свободно"}
                </span>
              </div>
            </div>

            <div className={styles.monthCellBody}>
              <span className={styles.monthStateLabel}>
                {day.workingStateLabel}
              </span>
              <span className={styles.monthActivityLabel}>
                {day.activityLabel}
              </span>
              {day.hasOverride && day.overrideNotePreview !== "Без заметки" ? (
                <span className={styles.monthOverrideNote}>
                  {day.overrideNotePreview}
                </span>
              ) : null}
            </div>

            <div className={styles.monthCellFooter}>
              <span>Нажмите, чтобы открыть детали дня</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}