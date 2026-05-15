import { useEffect } from "react";
import { Link } from "react-router-dom";

import { preferredContactMethodLabels } from "../../../lib/preferredContact";
import type { ClientStatus, CrmClientRecord } from "../../../types/client";
import styles from "./ClientsPage.module.css";

type ClientDetailsModalProps = {
  client: CrmClientRecord;
  sourceLabels: Record<string, string>;
  statusLabels: Record<ClientStatus, string>;
  onClose: () => void;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

function getPreferredContactLabel(client: CrmClientRecord): string {
  if (!client.preferredContactMethod || !client.preferredContactValue) {
    return "-";
  }

  return `${preferredContactMethodLabels[client.preferredContactMethod]}: ${client.preferredContactValue}`;
}

function getClientStatusBadgeClass(status: ClientStatus): string {
  return [
    styles.clientStatusBadge,
    status === "inactive"
      ? styles.clientStatusBadgeInactive
      : styles.clientStatusBadgeActive,
  ].join(" ");
}

export function ClientDetailsModal({
  client,
  sourceLabels,
  statusLabels,
  onClose,
}: ClientDetailsModalProps) {
  useEffect(() => {
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

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const sourceLabel = sourceLabels[client.source] ?? client.source;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="client-details-title"
        aria-modal="true"
        className={styles.modalDialog}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="client-details-title" className={styles.modalTitle}>
              Данные клиента
            </h2>
            <p className={styles.modalSubtitle}>{client.name}</p>
          </div>

          <button
            aria-label="Закрыть"
            className={styles.modalCloseButton}
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.detailsGrid}>
          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Имя</span>
            <span className={styles.detailsValue}>{client.name}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Телефон</span>
            <span className={styles.detailsValue}>{client.phone || "-"}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Email</span>
            <span className={styles.detailsValue}>{client.email || "-"}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>
              Предпочтительный способ связи
            </span>
            <span className={styles.detailsValue}>
              {getPreferredContactLabel(client)}
            </span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Статус</span>
            <span className={styles.detailsValue}>
              <span className={getClientStatusBadgeClass(client.status)}>
                {statusLabels[client.status]}
              </span>
            </span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Источник</span>
            <span className={styles.detailsValue}>{sourceLabel || "-"}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Первая заявка</span>
            <span className={styles.detailsValue}>
              {client.firstRequestId ? (
                <Link
                  to={`/admin/requests?highlightRequestId=${client.firstRequestId}`}
                >
                  Перейти к заявке
                </Link>
              ) : (
                "-"
              )}
            </span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Дата создания</span>
            <span className={styles.detailsValue}>
              {formatDateTime(client.createdAt)}
            </span>
          </div>
        </div>

        <div className={styles.detailsActions}>
          <Link
            className={styles.detailsActionLink}
            to={`/admin/sessions?clientId=${encodeURIComponent(
              String(client.id)
            )}`}
          >
            Сессии
          </Link>

          <Link
            className={styles.detailsActionLink}
            to={`/admin/notes?clientId=${encodeURIComponent(
              String(client.id)
            )}`}
          >
            Заметки
          </Link>
        </div>
      </section>
    </div>
  );
}