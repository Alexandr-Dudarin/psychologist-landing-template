import { useEffect, useId, useRef } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import type { SchedulerEmptySlotSelection } from "./premiumScheduler.helpers";
import styles from "./SchedulerEmptySlotActionModal.module.css";

type SchedulerEmptySlotActionModalProps = {
  selection: SchedulerEmptySlotSelection | null;
  onClose: () => void;
  onCreateBlockedSlot: () => void;
  onCreateSession: () => void;
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

export function SchedulerEmptySlotActionModal({
  selection,
  onClose,
  onCreateBlockedSlot,
  onCreateSession,
}: SchedulerEmptySlotActionModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selection) {
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
  }, [selection, onClose]);

  if (!selection) {
    return null;
  }

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
              Что создать?
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

        <div className={styles.body}>
          <div className={styles.summaryBox}>
            <span className={styles.summaryLabel}>Выбранный слот</span>
            <span className={styles.summaryValue}>
              {formatDateKey(selection.dateKey)}, {selection.startTime}–
              {selection.endTime}
            </span>
          </div>

          <div className={styles.actionsGrid}>
            <AdminButton type="button" variant="primary" onClick={onCreateSession}>
              Создать сессию
            </AdminButton>

            <AdminButton
              type="button"
              variant="secondary"
              onClick={onCreateBlockedSlot}
            >
              Создать блокировку / перерыв
            </AdminButton>
          </div>

          <p className={styles.hint}>
            Время подставлено по месту клика в сетке. Его можно изменить в
            следующей форме.
          </p>
        </div>
      </section>
    </div>
  );
}