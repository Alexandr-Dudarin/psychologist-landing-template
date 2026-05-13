import type { FormEvent } from "react";

import type { CalendarDateMeta } from "../../../components/calendar/calendar.types";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import { AdminScheduleDatePicker } from "./AdminScheduleDatePicker";
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

function buildBlockedSlotsCalendarMeta(
  blockedSlots: BlockedSlotsList
): CalendarDateMeta[] {
  const groupedBlockedSlots = new Map<string, BlockedSlotsList>();

  for (const item of blockedSlots) {
    const date = item.blockedDate.slice(0, 10);
    const currentItems = groupedBlockedSlots.get(date) ?? [];
    currentItems.push(item);
    groupedBlockedSlots.set(date, currentItems);
  }

  return Array.from(groupedBlockedSlots.entries()).map(([date, items]) => ({
    date,
    state: "blocked",
    label: items.length === 1 ? "Блокировка" : "Блокировки",
    hint:
      items.length === 1
        ? `${items[0].startTime} - ${items[0].endTime}`
        : `Слотов закрыто: ${items.length}`,
    badge: String(items.length),
  }));
}

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
        <AdminScheduleDatePicker
          label="Дата блокировки"
          hint={
            isEditing
              ? "Вы редактируете выбранную блокировку. Дата остаётся явно видимой над календарём."
              : "Выберите дату, затем укажите диапазон времени, который нужно закрыть."
          }
          value={blockedSlotForm.blockedDate}
          onChange={(date) => onFormChange("blockedDate", date)}
          datesMeta={buildBlockedSlotsCalendarMeta(blockedSlots)}
          emptyText="Выберите дату блокировки"
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
          <AdminButton type="submit" disabled={isSubmitting} variant="primary">
            {isSubmitting
              ? isEditing
                ? "Сохранение..."
                : "Создание..."
              : isEditing
                ? "Сохранить изменения"
                : "Создать блокировку"}
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
                  {item.startTime}-{item.endTime}
                </td>
                <td>{item.reason || "-"}</td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionsCellInner}>
                    <AdminButton
                      type="button"
                      onClick={() => onEdit(item.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Редактировать
                    </AdminButton>

                    <AdminButton
                      type="button"
                      onClick={() => onDelete(item.id)}
                      disabled={deletingBlockedSlotId === item.id}
                      variant="danger"
                      size="sm"
                    >
                      {deletingBlockedSlotId === item.id
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