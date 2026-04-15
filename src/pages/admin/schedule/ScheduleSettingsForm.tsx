import type { FormEvent } from "react";

import styles from "./SchedulePage.module.css";
import type { FeedbackState, SettingsForm } from "./schedulePage.shared";

type ScheduleSettingsFormProps = {
  feedback: FeedbackState;
  isSaving: boolean;
  settingsForm: SettingsForm;
  onCheckboxChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTextChange: (
    field: "minAdvanceHours" | "bufferMinutes" | "maxDaysAhead",
    value: string
  ) => void;
};

export function ScheduleSettingsForm({
  feedback,
  isSaving,
  settingsForm,
  onCheckboxChange,
  onSubmit,
  onTextChange,
}: ScheduleSettingsFormProps) {
  const feedbackClassName = feedback
    ? `${styles.feedback} ${
        feedback.tone === "success"
          ? styles.feedbackSuccess
          : styles.feedbackError
      }`
    : null;

  return (
    <form onSubmit={onSubmit}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Общие настройки записи</h2>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Минимум часов до записи</span>
            <input
              type="number"
              min="0"
              step="1"
              value={settingsForm.minAdvanceHours}
              onChange={(event) =>
                onTextChange("minAdvanceHours", event.target.value)
              }
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Буфер между сессиями, минут</span>
            <input
              type="number"
              min="0"
              step="1"
              value={settingsForm.bufferMinutes}
              onChange={(event) =>
                onTextChange("bufferMinutes", event.target.value)
              }
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>На сколько дней вперёд можно записаться</span>
            <input
              type="number"
              min="1"
              step="1"
              value={settingsForm.maxDaysAhead}
              onChange={(event) =>
                onTextChange("maxDaysAhead", event.target.value)
              }
              className={styles.input}
            />
          </label>

          <label className={`${styles.field} ${styles.checkboxFieldEnd}`}>
            <span>Разрешить запись на текущий день</span>
            <input
              type="checkbox"
              checked={settingsForm.allowSameDayBooking}
              onChange={(event) => onCheckboxChange(event.target.checked)}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSaving}
            className={styles.button}
          >
            {isSaving ? "Сохранение..." : "Сохранить настройки"}
          </button>
        </div>

        {feedback ? <p className={feedbackClassName}>{feedback.message}</p> : null}
      </section>
    </form>
  );
}
