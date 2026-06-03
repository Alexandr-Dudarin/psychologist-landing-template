import { useEffect, useId, useRef, type FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminTimeSelect } from "../../../components/admin/AdminTimeSelect";
import { SCHEDULE_TEXT_FIELD_MAX_LENGTH } from "../schedule/schedulePageValidation";
import styles from "./SchedulerBlockedSlotModal.module.css";

export type SchedulerBlockedSlotDraft = {
  dateKey: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type SchedulerBlockedSlotModalProps = {
  draft: SchedulerBlockedSlotDraft | null;
  error: string;
  isSubmitting: boolean;
  onChange: (field: keyof SchedulerBlockedSlotDraft, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return dateKey;
  }

  return new Date(year, month - 1, day).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SchedulerBlockedSlotModal({
  draft,
  error,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: SchedulerBlockedSlotModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [draft, onClose]);

  if (!draft) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.kicker}>Планировщик</span>
            <h2 id={titleId} className={styles.title}>
              Создать блокировку
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            aria-label="Закрыть"
            className={styles.closeButton}
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.summaryBox}>
            <span className={styles.summaryLabel}>Дата</span>
            <span className={styles.summaryValue}>
              {formatDateKey(draft.dateKey)}
            </span>
          </div>

          <div className={styles.fieldsGrid}>
            <label className={styles.field}>
              <span>Начало</span>
              <AdminTimeSelect
                value={draft.startTime}
                onChange={(nextTime) => onChange("startTime", nextTime)}
                ariaLabel="Начало блокировки из планировщика"
                className={styles.timeSelect}
              />
            </label>

            <label className={styles.field}>
              <span>Окончание</span>
              <AdminTimeSelect
                value={draft.endTime}
                onChange={(nextTime) => onChange("endTime", nextTime)}
                ariaLabel="Окончание блокировки из планировщика"
                className={styles.timeSelect}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Причина</span>
            <textarea
              value={draft.reason}
              onChange={(event) => onChange("reason", event.target.value)}
              maxLength={SCHEDULE_TEXT_FIELD_MAX_LENGTH}
              placeholder="Например: перерыв, личное, занято"
              className={styles.textarea}
            />
          </label>

          <AdminFeedback message={error} tone="error" />

          <div className={styles.actions}>
            <AdminButton type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Создаём..." : "Создать блокировку"}
            </AdminButton>

            <AdminButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отменить
            </AdminButton>
          </div>

          <p className={styles.hint}>
            Блокировка сохранится в общем расписании и будет доступна для
            редактирования в разделе «Расписание».
          </p>
        </form>
      </section>
    </div>
  );
}