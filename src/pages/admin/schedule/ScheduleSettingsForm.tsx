import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import styles from "./SchedulePage.module.css";
import {
  bookingTimezoneOptionGroups,
  type FeedbackState,
  type SettingsForm,
} from "./schedulePage.shared";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";

type ScheduleSettingsFormProps = {
  feedback: FeedbackState;
  isSaving: boolean;
  settingsForm: SettingsForm;
  onCheckboxChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTextChange: (
    field: "minAdvanceHours" | "bufferMinutes" | "maxDaysAhead" | "timezone",
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
            <span className={styles.fieldLabel}>Минимум часов до записи</span>
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
            <span className={styles.fieldLabel}>Перерыв между сессиями, минут</span>
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
            <span className={styles.fieldLabel}>
              На сколько дней вперёд можно записаться
            </span>
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

          <label className={`${styles.field} ${styles.wideField}`}>
            <span className={styles.fieldLabel}>Часовой пояс записи</span>
            <CustomSelect
              value={settingsForm.timezone}
              options={timezoneOptions}
              onChange={(nextTimezone) => onTextChange("timezone", nextTimezone)}
              ariaLabel="Часовой пояс записи"
              variant="admin"
              layout="full"
              className={styles.timezoneSelect}
            />

            <span className={styles.fieldHint}>
              Этот часовой пояс используется для онлайн-записи ваших клиентов, и
              связанных уведомлений. Ваше рабочее расписание строится по выбранному вами часовому поясу.
            </span>
          </label>

          <label className={`${styles.field} ${styles.checkboxField}`}>
            <span className={styles.checkboxLabelCopy}>
              <span className={styles.checkboxLabelTitle}>
                Разрешить запись на текущий день
              </span>
              <span className={styles.checkboxLabelHint}>
                Включите, если запись на сегодня должна оставаться доступной в
                обычном режиме.
              </span>
            </span>

            <span className={styles.checkboxControl}>
              <input
                type="checkbox"
                checked={settingsForm.allowSameDayBooking}
                onChange={(event) => onCheckboxChange(event.target.checked)}
                className={styles.checkboxInput}
              />
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <AdminButton type="submit" disabled={isSaving} variant="primary">
            {isSaving ? "Сохранение..." : "Сохранить настройки"}
          </AdminButton>
        </div>

        <AdminFeedback
          message={feedback?.message}
          tone={feedback?.tone ?? "error"}
        />
      </AdminSection>
    </form>
  );
}

const timezoneOptions: CustomSelectOption[] = bookingTimezoneOptionGroups.flatMap(
  (group) => [
    {
      value: `__group_${group.label}`,
      label: group.label,
      kind: "group",
    },
    ...group.options.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ]
);
