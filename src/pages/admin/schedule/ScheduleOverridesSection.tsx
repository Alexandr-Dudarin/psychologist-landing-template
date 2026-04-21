import type { FormEvent } from "react";

import type { CalendarDateMeta } from "../../../components/calendar/calendar.types";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import { AdminScheduleDatePicker } from "./AdminScheduleDatePicker";
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

function buildOverrideCalendarMeta(
  overrides: ScheduleOverrideList
): CalendarDateMeta[] {
  return overrides.map((item) => ({
    date: item.date.slice(0, 10),
    state: item.isWorkingDay ? "available" : "blocked",
    label: item.isWorkingDay ? "Рабочий день" : "Выходной",
    hint: item.note || "Для этой даты уже задано отдельное правило.",
  }));
}

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
        <AdminScheduleDatePicker
          label="Дата исключения"
          hint={
            isEditing
              ? "Вы редактируете уже существующее исключение. Выбранная дата подсвечена в календаре."
              : "Выберите дату, для которой нужно задать отдельное правило работы."
          }
          value={form.date}
          onChange={(date) => onFormChange("date", date)}
          datesMeta={buildOverrideCalendarMeta(overrides)}
          emptyText="Выберите дату исключения"
          disablePast
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

          {isEditing ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className={styles.button}
            >
              Отменить
            </button>
          ) : null}
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
                <td>{item.isWorkingDay ? "Рабочий день" : "Выходной"}</td>
                <td>
                  {item.isWorkingDay && item.startTime && item.endTime
                    ? `${item.startTime}-${item.endTime}`
                    : "-"}
                </td>
                <td>{item.note || "-"}</td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionsCellInner}>
                    <button
                      type="button"
                      onClick={() => onEdit(item.date)}
                      className={`${styles.button} ${styles.actionButtonSecondary}`}
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item.date)}
                      disabled={deletingOverrideDate === item.date}
                      className={`${styles.button} ${styles.actionButtonDanger}`}
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
