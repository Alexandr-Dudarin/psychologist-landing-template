import type { FormEvent } from "react";

import type { CalendarDateMeta } from "../../../components/calendar/calendar.types";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import { AdminScheduleDatePicker } from "./AdminScheduleDatePicker";
import { AdminTimeSelect } from "../../../components/admin/AdminTimeSelect";
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
              : "Выберите дату, затем укажите диапазон времени, который станет рабочими часами в этот день."
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

        <div className={styles.timeFieldsGrid}>
          <label className={styles.field}>
            <span>Начало</span>
            <AdminTimeSelect
              value={form.startTime}
              onChange={(nextTime) => onFormChange("startTime", nextTime)}
              ariaLabel="Начало исключения по дате"
              disabled={!form.isWorkingDay}
              className={styles.timeSelect}
            />
          </label>

          <label className={styles.field}>
            <span>Окончание</span>
            <AdminTimeSelect
              value={form.endTime}
              onChange={(nextTime) => onFormChange("endTime", nextTime)}
              ariaLabel="Окончание исключения по дате"
              disabled={!form.isWorkingDay}
              className={styles.timeSelect}
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
          <AdminButton type="submit" disabled={isSubmitting} variant="primary">
            {isSubmitting
              ? isEditing
                ? "Сохранение..."
                : "Создание..."
              : isEditing
                ? "Сохранить изменения"
                : "Сохранить исключение"}
          </AdminButton>

          {isEditing ? (
            <AdminButton
              type="button"
              onClick={onCancelEdit}
              variant="secondary"
            >
              Отменить
            </AdminButton>
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
              <th className={`${styles.centerHeader} ${styles.overrideTypeColumn}`}>
                Тип
              </th>
              <th className={styles.centerHeader}>Время</th>
              <th className={styles.centerHeader}>Комментарий</th>
              <th className={styles.actionsHeader}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((item) => (
              <tr key={item.date}>
                <td>{formatDate(item.date)}</td>

                <td className={`${styles.centerCell} ${styles.overrideTypeColumn}`}>
                  {item.isWorkingDay ? "Рабочий день" : "Выходной"}
                </td>

                <td className={styles.centerCell}>
                  {item.isWorkingDay && item.startTime && item.endTime ? (
                    `${item.startTime}-${item.endTime}`
                  ) : (
                    <span className={styles.emptyValue}>—</span>
                  )}
                </td>

                <td className={styles.centerCell}>
                  {item.note || <span className={styles.emptyValue}>—</span>}
                </td>

                <td className={styles.actionsCell}>
                  <div className={styles.actionsCellInner}>
                    <AdminButton
                      type="button"
                      onClick={() => onEdit(item.date)}
                      variant="secondary"
                      size="sm"
                    >
                      Редактировать
                    </AdminButton>

                    <AdminButton
                      type="button"
                      onClick={() => onDelete(item.date)}
                      disabled={deletingOverrideDate === item.date}
                      variant="danger"
                      size="sm"
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