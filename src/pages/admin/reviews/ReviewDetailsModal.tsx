import { useEffect, useId, useRef } from "react";

import type {
  ClientReviewAdminRecord,
  ClientReviewStatus,
} from "../../../types/reviews";
import styles from "./AdminReviewsPage.module.css";

type ReviewDetailsModalProps = {
  adminNote: string;
  item: ClientReviewAdminRecord;
  onClose: () => void;
};

const statusLabels: Record<ClientReviewStatus, string> = {
  pending: "На проверке",
  published: "Опубликован",
  hidden: "Скрыт",
  deleted: "Удалён",
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPublicName(value: string): string {
  return value.trim() || "Анонимный отзыв";
}

function getRatingLabel(rating: number | null): string {
  if (rating === null) {
    return "Без оценки";
  }

  return `${rating} / 5`;
}

export function ReviewDetailsModal({
  adminNote,
  item,
  onClose,
}: ReviewDetailsModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={styles.detailOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.detailDialog}
        role="dialog"
      >
        <header className={styles.detailHeader}>
          <div>
            <span className={styles.detailKicker}>Отзыв клиента</span>
            <h3 id={titleId} className={styles.detailTitle}>
              {getPublicName(item.publicName)}
            </h3>
          </div>

          <button
            ref={closeButtonRef}
            aria-label="Закрыть"
            className={styles.detailCloseButton}
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.detailBody}>
          <div className={styles.detailMetaGrid}>
            <div className={styles.detailMetaItem}>
              <span>Оценка</span>
              <strong>{getRatingLabel(item.rating)}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Статус</span>
              <strong>{statusLabels[item.status]}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Клиент</span>
              <strong>{item.clientName}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Телефон</span>
              <strong>{item.clientPhone || "Не указан"}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Email</span>
              <strong>{item.clientEmail || "Не указан"}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Создан</span>
              <strong>{formatDateTime(item.createdAt)}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Опубликован</span>
              <strong>{formatDateTime(item.publishedAt)}</strong>
            </div>

            <div className={styles.detailMetaItem}>
              <span>Проверочная сессия</span>
              <strong>
                {item.eligibilitySessionId ? "Найдена" : "Не указана"}
              </strong>
            </div>
          </div>

          <div className={styles.detailBlock}>
            <h4>Текст отзыва</h4>
            <p className={styles.detailText}>{item.text}</p>
          </div>

          {adminNote.trim() ? (
            <div className={styles.detailBlock}>
              <h4>Заметка админа</h4>
              <p className={styles.detailText}>{adminNote}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}