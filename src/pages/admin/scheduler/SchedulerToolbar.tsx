import type { SchedulerViewMode } from "./premiumScheduler.shared";
import styles from "./SchedulerToolbar.module.css";

type SchedulerToolbarProps = {
  rangeLabel: string;
  viewMode: SchedulerViewMode;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onViewModeChange: (mode: SchedulerViewMode) => void;
};

export function SchedulerToolbar({
  rangeLabel,
  viewMode,
  onPrev,
  onToday,
  onNext,
  onViewModeChange,
}: SchedulerToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarPrimary}>
        <div>
          <div className={styles.toolbarTitle}>{rangeLabel}</div>
          <div className={styles.toolbarHint}>
            {viewMode === "week"
              ? "Неделя остается обзорным режимом с более компактными заголовками."
              : viewMode === "day"
                ? "День раскрывает больше контекста по записи и лучше держит вертикальный ритм."
                : "Месяц остается обзорным слоем с понятными уровнями загрузки и доступности."}
          </div>
        </div>
      </div>

      <div className={styles.toolbarSecondary}>
        <div className={styles.dateNavigation}>
          <button type="button" className={styles.iconButton} onClick={onPrev}>
            Назад
          </button>
          <button type="button" className={styles.iconButton} onClick={onToday}>
            Сегодня
          </button>
          <button type="button" className={styles.iconButton} onClick={onNext}>
            Вперед
          </button>
        </div>

        <div className={styles.viewSwitch}>
          {(["week", "day", "month"] as SchedulerViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.viewButton} ${
                viewMode === mode ? styles.viewButtonActive : ""
              }`}
              onClick={() => onViewModeChange(mode)}
            >
              {mode === "week" ? "Неделя" : mode === "day" ? "День" : "Месяц"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}