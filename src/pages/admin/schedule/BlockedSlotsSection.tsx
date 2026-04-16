import type { FormEvent } from "react";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
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
  editingBlockedSlotId: number | null;
  feedback: FeedbackState;
  isSubmitting: boolean;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onFormChange: (field: keyof BlockedSlotForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function BlockedSlotsSection({
  blockedSlotForm,
  blockedSlots,
  deletingBlockedSlotId,
  editingBlockedSlotId,
  feedback,
  isSubmitting,
  onCancelEdit,
  onDelete,
  onEdit,
  onFormChange,
  onSubmit,
}: BlockedSlotsSectionProps) {
  const isEditing = editingBlockedSlotId !== null;

  return (
    <AdminSection title="Ручное закрытие отдельных слотов">
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
              : "Создать блокировку"}
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

      {blockedSlots.length === 0 ? (
        <p>Блокировок слотов пока нет.</p>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Время</th>
              <th>Причина</th>
              <th className={styles.actionsHeader}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {blockedSlots.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.blockedDate)}</td>
                <td>
                  {item.startTime}–{item.endTime}
                </td>
                <td>{item.reason || "-"}</td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionsCellInner}>
                    <button
                      type="button"
                      onClick={() => onEdit(item.id)}
                      className={styles.button}
                    >
                      Редактировать
                    </button>

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