import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import styles from "./SchedulePage.module.css";
import {
  formatDate,
  type FeedbackState,
  type OverrideForm,
  type ScheduleOverrideList,
} from "./schedulePage.shared";

type ScheduleOverridesSectionProps = {
  deletingOverrideDate: string | null;
  feedback: FeedbackState;
  form: OverrideForm;
  isCreatingOverride: boolean;
  overrides: ScheduleOverrideList;
  onDelete: (date: string) => void;
  onFormChange: (field: keyof OverrideForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ScheduleOverridesSection({
  deletingOverrideDate,
  feedback,
  form,
  isCreatingOverride,
  overrides,
  onDelete,
  onFormChange,
  onSubmit,
}: ScheduleOverridesSectionProps) {
  return (
    <AdminSection title="Исключения по конкретным датам">
      <form onSubmit={onSubmit} className={styles.stackForm}>
        <input
          type="date"
          value={form.date}
          onChange={(event) => onFormChange("date", event.target.value)}
          className={styles.input}
        />

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.isWorkingDay}
            onChange={(event) =>
              onFormChange("isWorkingDay", event.target.checked)
            }
          />
          <span>{"Это рабочий день с особым временем"}</span>
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>{"Начало"}</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => onFormChange("startTime", event.target.value)}
              disabled={!form.isWorkingDay}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>{"Окончание"}</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => onFormChange("endTime", event.target.value)}
              disabled={!form.isWorkingDay}
              className={styles.input}
            />
          </label>
        </div>

        <textarea
          value={form.note}
          onChange={(event) => onFormChange("note", event.target.value)}
          placeholder="Комментарий к исключению"
          className={`${styles.input} ${styles.textarea}`}
        />

        <div>
          <AdminButton
            type="submit"
            disabled={isCreatingOverride}
            variant="primary"
          >
            {isCreatingOverride
              ? "Сохранение..."
              : "Сохранить исключение"}
          </AdminButton>
        </div>

        <AdminFeedback
          message={feedback?.message}
          tone={feedback?.tone ?? "error"}
        />
      </form>

      {overrides.length === 0 ? (
        <p>{"Исключений по датам пока нет."}</p>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <th>{"Дата"}</th>
              <th>{"Тип"}</th>
              <th>{"Время"}</th>
              <th>{"Комментарий"}</th>
              <th className={styles.actionsHeader}>{"Действия"}</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td>
                  {item.isWorkingDay
                    ? "Рабочий день"
                    : "Нерабочий день"}
                </td>
                <td>
                  {item.isWorkingDay && item.startTime && item.endTime
                    ? `${item.startTime}–${item.endTime}`
                    : "-"}
                </td>
                <td>{item.note || "-"}</td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionsCellInner}>
                    <AdminButton
                      type="button"
                      onClick={() => onDelete(item.date)}
                      disabled={deletingOverrideDate === item.date}
                      className={styles.actionButton}
                      size="sm"
                      variant="danger"
                    >
                      {deletingOverrideDate === item.date
                        ? "Удаление..."
                        : "Удалить"}
                    </AdminButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminSection>
  );
}
