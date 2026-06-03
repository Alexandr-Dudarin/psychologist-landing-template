import { useEffect, useId, useRef, type FormEvent } from "react";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import type {
  CrmClientRecord,
  CrmClientServicePackageRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import { SessionCreateForm } from "../sessions/SessionCreateForm";
import type { SessionForm } from "../sessions/sessionForm";
import styles from "./SchedulerSessionModal.module.css";

type SchedulerSessionModalProps = {
  activeServices: CrmServiceRecord[];
  clientPackages: CrmClientServicePackageRecord[];
  clients: CrmClientRecord[];
  draft: SessionForm | null;
  error: string;
  isCreating: boolean;
  isPackagesLoading: boolean;
  scheduleWarning: string | null;
  timezone: string;
  onChange: (field: keyof SessionForm, value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function SchedulerSessionModal({
  activeServices,
  clientPackages,
  clients,
  draft,
  error,
  isCreating,
  isPackagesLoading,
  scheduleWarning,
  timezone,
  onChange,
  onClose,
  onSubmit,
}: SchedulerSessionModalProps) {
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
              Создать сессию
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
          <AdminFeedback message={error} tone="error" />

          {scheduleWarning ? (
            <div className={styles.warningFeedback} role="status">
              {scheduleWarning}
            </div>
          ) : null}

          <SessionCreateForm
            clients={clients}
            activeServices={activeServices}
            clientPackages={clientPackages}
            form={draft}
            timezone={timezone}
            isCreating={isCreating}
            isPackagesLoading={isPackagesLoading}
            onFormChange={onChange}
            onSubmit={onSubmit}
          />

          <p className={styles.hint}>
            Сессия создаётся через общую CRM-логику. После сохранения она
            появится в планировщике и в разделе «Сессии».
          </p>
        </div>
      </section>
    </div>
  );
}