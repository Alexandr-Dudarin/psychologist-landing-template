import { useEffect, useId, useRef } from "react";

import { SchedulerDetailPanel } from "./SchedulerDetailPanel";
import styles from "./SchedulerDetailModal.module.css";
import type { SchedulerDetail } from "./premiumScheduler.helpers";

type SchedulerDetailModalProps = {
  detail: SchedulerDetail | null;
  isDayActionSaving?: boolean;
  onClose: () => void;
  onMakeDayNonWorking?: (dateKey: string) => void;
  onMakeDayWorking?: (dateKey: string) => void;
};

function getDetailKindLabel(detail: SchedulerDetail): string {
  if (detail.kind === "session") {
    return "Сессия";
  }

  if (detail.kind === "blocked") {
    return "Блокировка";
  }

  return "День";
}

function shouldAutoFocusCloseButton(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function SchedulerDetailModal({
  detail,
  isDayActionSaving = false,
  onClose,
  onMakeDayNonWorking,
  onMakeDayWorking,
}: SchedulerDetailModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!detail) {
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
    if (shouldAutoFocusCloseButton()) {
      closeButtonRef.current?.focus();
    } else {
      window.getSelection?.()?.removeAllRanges();
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [detail, onClose]);

  if (!detail) {
    return null;
  }

  const kindLabel = getDetailKindLabel(detail);

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
            <span className={styles.kicker}>Детали планировщика</span>
            <h2 id={titleId} className={styles.title}>
              {kindLabel}
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
          <SchedulerDetailPanel
            detail={detail}
            isDayActionSaving={isDayActionSaving}
            onMakeDayNonWorking={onMakeDayNonWorking}
            onMakeDayWorking={onMakeDayWorking}
          />
        </div>
      </section>
    </div>
  );
}