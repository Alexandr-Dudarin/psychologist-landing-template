import { useEffect } from "react";

import type { CrmRequestRecord, RequestStatus } from "../../../types/request";
import styles from "./RequestsPage.module.css";

type StatusOption = {
  value: RequestStatus;
  label: string;
};

type RequestDetailsModalProps = {
  item: CrmRequestRecord;
  statusOptions: StatusOption[];
  onClose: () => void;
};

function formatRequestDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

export function RequestDetailsModal({
  item,
  statusOptions,
  onClose,
}: RequestDetailsModalProps) {
  const statusLabel =
    statusOptions.find((status) => status.value === item.status)?.label ??
    item.status;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={styles.requestDetailsOverlay}
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className={styles.requestDetailsModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.requestDetailsHeader}>
          <div>
            <div className={styles.requestDetailsEyebrow}>
              Сообщение заявки
            </div>
            <h2 id="request-details-title" className={styles.requestDetailsTitle}>
              {item.name}
            </h2>
          </div>

          <button
            type="button"
            className={styles.requestDetailsCloseButton}
            onClick={onClose}
            aria-label="Закрыть подробности заявки"
          >
            ×
          </button>
        </div>

        <div className={styles.requestDetailsGrid}>
          <div className={styles.requestDetailsField}>
            <div className={styles.requestDetailsLabel}>Создана</div>
            <div className={styles.requestDetailsValue}>
              {formatRequestDate(item.createdAt)}
            </div>
          </div>

          <div className={styles.requestDetailsField}>
            <div className={styles.requestDetailsLabel}>Статус</div>
            <div className={styles.requestDetailsValue}>{statusLabel}</div>
          </div>

          <div className={styles.requestDetailsField}>
            <div className={styles.requestDetailsLabel}>Телефон</div>
            <div className={styles.requestDetailsValue}>
              {item.phone || <span className={styles.emptyValue}>—</span>}
            </div>
          </div>

          <div className={styles.requestDetailsField}>
            <div className={styles.requestDetailsLabel}>Email</div>
            <div className={styles.requestDetailsValue}>
              {item.email || <span className={styles.emptyValue}>—</span>}
            </div>
          </div>
        </div>

        <div className={styles.requestDetailsMessageBlock}>
          <div className={styles.requestDetailsMessageTitle}>
            Текст сообщения
          </div>
          <div className={styles.requestDetailsMessage}>
            {item.message?.trim() || <span className={styles.emptyValue}>—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}