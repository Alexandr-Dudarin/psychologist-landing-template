import styles from "./SchedulerEventCard.module.css";
import { truncateText } from "./premiumScheduler.helpers";
import type { SchedulerOverlayItem, SchedulerViewMode } from "./premiumScheduler.shared";

type SchedulerEventCardProps = {
  item: SchedulerOverlayItem;
  viewMode: SchedulerViewMode;
  top: number;
  height: number;
  onClick: () => void;
};

export function SchedulerEventCard({
  item,
  viewMode,
  top,
  height,
  onClick,
}: SchedulerEventCardProps) {
  const conflictOffset = item.hasConflict ? Math.min(item.conflictOrder * 14, 28) : 0;
  const isWeekMode = viewMode === "week";
  const visualHeight = isWeekMode ? Math.max(height, 104) : Math.max(height, 124);

  return (
    <button
      type="button"
      className={`${item.tone === "session" ? styles.sessionBlock : styles.blockedBlock} ${isWeekMode ? styles.blockWeek : styles.blockExpanded
        } ${item.hasConflict ? styles.blockConflict : ""}`}
      style={{
        top: `${top}px`,
        height: `${visualHeight}px`,
        left: `${isWeekMode ? 8 : 12 + conflictOffset}px`,
        right: `${isWeekMode ? 8 : 12 + Math.max(0, 16 - conflictOffset)}px`,
        zIndex: item.hasConflict ? 4 + item.conflictOrder : 3,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {isWeekMode ? (
        <>
          <div className={styles.blockWeekTop}>
            <span className={styles.blockTimePill}>{item.timeLabel}</span>
            {item.tone === "blocked" ? (
              <span className={styles.blockWeekTypeMuted}>Блок</span>
            ) : null}
          </div>

          <span className={styles.blockWeekTitle}>{item.title}</span>

          <span className={styles.blockWeekMeta}>
            {item.tone === "session"
              ? truncateText(item.serviceTitle, 24)
              : truncateText(item.reasonPreview, 24)}
          </span>
        </>
      ) : (
        <>
          <div className={styles.blockTop}>
            <span className={styles.blockTimePill}>{item.timeLabel}</span>
            <div className={styles.blockBadges}>
              {item.tone === "session" ? (
                <span className={styles.blockStatusBadge}>{item.statusLabel}</span>
              ) : (
                <span className={styles.blockStatusBadgeMuted}>Блокировка</span>
              )}
            </div>
          </div>

          <span className={styles.blockTitle}>{item.title}</span>

          <span className={styles.blockSubtitle}>
            {item.tone === "session"
              ? truncateText(item.serviceTitle, 88)
              : truncateText(item.reasonPreview, 88)}
          </span>

          {item.tone === "session" && item.notePreview !== "Без заметки" ? (
            <span className={styles.blockNote}>{truncateText(item.notePreview, 110)}</span>
          ) : null}
        </>
      )}
    </button>
  );
}