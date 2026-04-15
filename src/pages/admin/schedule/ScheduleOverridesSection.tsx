import type { FormEvent } from "react";

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
  const feedbackClassName = feedback
    ? `${styles.feedback} ${
        feedback.tone === "success"
          ? styles.feedbackSuccess
          : styles.feedbackError
      }`
    : null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Исключения по конкретным датам</h2>

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

        <div>
          <button
            type="submit"
            disabled={isCreatingOverride}
            className={styles.button}
          >
            {isCreatingOverride ? "Сохранение..." : "Сохранить исключение"}
          </button>
        </div>

        {feedback ? <p className={feedbackClassName}>{feedback.message}</p> : null}
      </form>

      <div className={`${styles.tableContainer} ${styles.tableContainerSpaced}`}>
        {overrides.length === 0 ? (
          <p>Исключений по датам пока нет.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeadCell}>Дата</th>
                <th className={styles.tableHeadCell}>Тип</th>
                <th className={styles.tableHeadCell}>Время</th>
                <th className={styles.tableHeadCell}>Комментарий</th>
                <th className={styles.tableHeadCell}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((item) => (
                <tr key={item.date}>
                  <td className={styles.tableCell}>{formatDate(item.date)}</td>
                  <td className={styles.tableCell}>
                    {item.isWorkingDay ? "Рабочий день" : "Нерабочий день"}
                  </td>
                  <td className={styles.tableCell}>
                    {item.isWorkingDay && item.startTime && item.endTime
                      ? `${item.startTime}–${item.endTime}`
                      : "-"}
                  </td>
                  <td className={styles.tableCell}>{item.note || "-"}</td>
                  <td className={styles.tableCell}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
