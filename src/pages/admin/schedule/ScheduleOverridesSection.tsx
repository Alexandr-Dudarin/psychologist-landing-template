import type { FormEvent } from "react";

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
  editingOverrideDate: string | null;
  feedback: FeedbackState;
  form: OverrideForm;
  isSubmitting: boolean;
  overrides: ScheduleOverrideList;
  onCancelEdit: () => void;
  onDelete: (date: string) => void;
  onEdit: (date: string) => void;
  onFormChange: (field: keyof OverrideForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ScheduleOverridesSection({
  deletingOverrideDate,
  editingOverrideDate,
  feedback,
  form,
  isSubmitting,
  overrides,
  onCancelEdit,
  onDelete,
  onEdit,
  onFormChange,
  onSubmit,
}: ScheduleOverridesSectionProps) {
  const isEditing = editingOverrideDate !== null;

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
          <span>Это рабочий день с особым временем</span>
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Начало</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => onFormChange("startTime", event.target.value)}
              disabled={!form.isWorkingDay}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Окончание</span>
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

        <div className={styles.buttonRow}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.button}
          >
            {isSubmitting
              ? isEditing
                ? "Сохранение..."
                : "Создание..."
              : isEditing
              ? "Сохранить изменения"
              : "Сохранить исключение"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className={styles.button}
            >
              Отменить
            </button>
          )}
        </div>

        <AdminFeedback
          message={feedback?.message}
          tone={feedback?.tone ?? "error"}
        />
      </form>

      {overrides.length === 0 ? (
        <p>Исключений по датам пока нет.</p>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Время</th>
              <th>Комментарий</th>
              <th className={styles.actionsHeader}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>
                <td>
                  {item.isWorkingDay ? "Рабочий день" : "Нерабочий день"}
                </td>
                <td>
                  {item.isWorkingDay && item.startTime && item.endTime
                    ? `${item.startTime}–${item.endTime}`
                    : "-"}
                </td>
                <td>{item.note || "-"}</td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionsCellInner}>
                    <button
                      type="button"
                      onClick={() => onEdit(item.date)}
                      className={styles.button}
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item.date)}
                      disabled={deletingOverrideDate === item.date}
                      className={styles.button}
                    >
                      {deletingOverrideDate === item.date
                        ? "Удаление..."
                        : "Удалить"}
                    </button>
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
