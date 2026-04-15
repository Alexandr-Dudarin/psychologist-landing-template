import type { FormEvent } from "react";

import styles from "./SchedulePage.module.css";
import {
  formatDate,
  type BlockedSlotForm,
  type BlockedSlotsList,
  type FeedbackState,
} from "./schedulePage.shared";

type BlockedSlotsSectionProps = {
  blockedSlotForm: BlockedSlotForm;
  blockedSlots: BlockedSlotsList;
  deletingBlockedSlotId: number | null;
  feedback: FeedbackState;
  isCreatingBlockedSlot: boolean;
  onDelete: (id: number) => void;
  onFormChange: (field: keyof BlockedSlotForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function BlockedSlotsSection({
  blockedSlotForm,
  blockedSlots,
  deletingBlockedSlotId,
  feedback,
  isCreatingBlockedSlot,
  onDelete,
  onFormChange,
  onSubmit,
}: BlockedSlotsSectionProps) {
  const feedbackClassName = feedback
    ? `${styles.feedback} ${
        feedback.tone === "success"
          ? styles.feedbackSuccess
          : styles.feedbackError
      }`
    : null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Ручное закрытие отдельных слотов</h2>

      <form onSubmit={onSubmit} className={styles.stackForm}>
        <input
          type="date"
          value={blockedSlotForm.blockedDate}
          onChange={(event) => onFormChange("blockedDate", event.target.value)}
          className={styles.input}
        />

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Начало</span>
            <input
              type="time"
              value={blockedSlotForm.startTime}
              onChange={(event) => onFormChange("startTime", event.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Окончание</span>
            <input
              type="time"
              value={blockedSlotForm.endTime}
              onChange={(event) => onFormChange("endTime", event.target.value)}
              className={styles.input}
            />
          </label>
        </div>

        <textarea
          value={blockedSlotForm.reason}
          onChange={(event) => onFormChange("reason", event.target.value)}
          placeholder="Причина блокировки"
          className={`${styles.input} ${styles.textarea}`}
        />

        <div>
          <button
            type="submit"
            disabled={isCreatingBlockedSlot}
            className={styles.button}
          >
            {isCreatingBlockedSlot ? "Создание..." : "Создать блокировку"}
          </button>
        </div>

        {feedback ? <p className={feedbackClassName}>{feedback.message}</p> : null}
      </form>

      <div className={`${styles.tableContainer} ${styles.tableContainerSpaced}`}>
        {blockedSlots.length === 0 ? (
          <p>Блокировок слотов пока нет.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeadCell}>Дата</th>
                <th className={styles.tableHeadCell}>Время</th>
                <th className={styles.tableHeadCell}>Причина</th>
                <th className={styles.tableHeadCell}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {blockedSlots.map((item) => (
                <tr key={item.id}>
                  <td className={styles.tableCell}>{formatDate(item.blockedDate)}</td>
                  <td className={styles.tableCell}>
                    {item.startTime}–{item.endTime}
                  </td>
                  <td className={styles.tableCell}>{item.reason || "-"}</td>
                  <td className={styles.tableCell}>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      disabled={deletingBlockedSlotId === item.id}
                      className={styles.button}
                    >
                      {deletingBlockedSlotId === item.id
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
