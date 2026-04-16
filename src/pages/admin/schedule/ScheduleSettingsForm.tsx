import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
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
  return (
    <form onSubmit={onSubmit}>
      <AdminSection title="Общие настройки записи">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>{"Минимум часов до записи"}</span>
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
            <span>{"Буфер между сессиями, минут"}</span>
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
            <span>{"На сколько дней вперёд можно записаться"}</span>
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
            <span>{"Разрешить запись на текущий день"}</span>
            <input
              type="checkbox"
              checked={settingsForm.allowSameDayBooking}
              onChange={(event) => onCheckboxChange(event.target.checked)}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <AdminButton type="submit" disabled={isSaving} variant="primary">
            {isSaving
              ? "Сохранение..."
              : "Сохранить настройки"}
          </AdminButton>
        </div>

        <AdminFeedback message={feedback?.message} tone={feedback?.tone ?? "error"} />
      </AdminSection>
    </form>
  );
}
