import { useEffect, useId, useRef, useState } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type {
  ClientReviewAdminRecord,
  ClientReviewStatus,
} from "../../../types/reviews";
import styles from "./AdminReviewsPage.module.css";

type AdminReviewsTableProps = {
  adminNoteDrafts: Record<number, string>;
  items: ClientReviewAdminRecord[];
  previewLimit: number;
  updatingId: number | null;
  onAdminNoteChange: (id: number, value: string) => void;
  onUpdateReview: (
    item: ClientReviewAdminRecord,
    status: ClientReviewStatus
  ) => void | Promise<void>;
};

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

function getPreviewText(value: string, limit: number): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= limit) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, limit).trimEnd()}…`;
}

function getStatusBadgeClassName(status: ClientReviewStatus): string {
  return [
    styles.statusBadge,
    status === "pending" ? styles.statusBadgePending : "",
    status === "published" ? styles.statusBadgePublished : "",
    status === "hidden" ? styles.statusBadgeHidden : "",
    status === "deleted" ? styles.statusBadgeDeleted : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getRatingBadgeClassName(rating: number | null): string {
  return [styles.ratingBadge, rating === null ? styles.ratingBadgeEmpty : ""]
    .filter(Boolean)
    .join(" ");
}

function getRowClassName(status: ClientReviewStatus): string | undefined {
  const classNames = [
    status === "pending" ? styles.pendingRow : "",
    status === "hidden" ? styles.hiddenRow : "",
    status === "deleted" ? styles.deletedRow : "",
  ].filter(Boolean);

  return classNames.length > 0 ? classNames.join(" ") : undefined;
}

function ReviewDetailsModal({
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

export function AdminReviewsTable({
  adminNoteDrafts,
  items,
  previewLimit,
  updatingId,
  onAdminNoteChange,
  onUpdateReview,
}: AdminReviewsTableProps) {
  const [selectedReview, setSelectedReview] =
    useState<ClientReviewAdminRecord | null>(null);

  return (
    <>
      <AdminTable withTopMargin={false} tableClassName={styles.reviewsTable}>
        <thead>
          <tr>
            <th className={styles.reviewCell}>Отзыв</th>
            <th className={styles.ratingCell}>Оценка</th>
            <th className={styles.clientCell}>Клиент</th>
            <th className={styles.statusCell}>Статус</th>
            <th className={styles.dateCell}>Даты</th>
            <th className={styles.noteCell}>Заметка админа</th>
            <th className={styles.actionCell}>Действия</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const isUpdating = updatingId === item.id;

            return (
              <tr key={item.id} className={getRowClassName(item.status)}>
                <td className={styles.reviewCell}>
                  <button
                    className={styles.reviewPreviewButton}
                    type="button"
                    onClick={() => setSelectedReview(item)}
                  >
                    <span className={styles.reviewAuthor}>
                      {getPublicName(item.publicName)}
                    </span>

                    <span className={styles.reviewText}>
                      {getPreviewText(item.text, previewLimit)}
                    </span>
                  </button>
                </td>

                <td className={styles.ratingCell}>
                  <span className={getRatingBadgeClassName(item.rating)}>
                    {getRatingLabel(item.rating)}
                  </span>
                </td>

                <td className={styles.clientCell}>
                  <div className={styles.clientPreview}>
                    <strong>{item.clientName}</strong>

                    <span>{item.clientPhone || "Телефон не указан"}</span>
                    <span>{item.clientEmail || "Email не указан"}</span>

                    {item.eligibilitySessionId ? (
                      <span className={styles.eligibilityText}>
                        Проверочная сессия найдена
                      </span>
                    ) : (
                      <span className={styles.eligibilityText}>
                        Проверочная сессия не указана
                      </span>
                    )}
                  </div>
                </td>

                <td className={styles.statusCell}>
                  <span className={getStatusBadgeClassName(item.status)}>
                    {statusLabels[item.status]}
                  </span>
                </td>

                <td className={styles.dateCell}>
                  <div className={styles.dateStack}>
                    <span>
                      <strong>Создан:</strong> {formatDateTime(item.createdAt)}
                    </span>
                    <span>
                      <strong>Опубликован:</strong>{" "}
                      {formatDateTime(item.publishedAt)}
                    </span>
                  </div>
                </td>

                <td className={styles.noteCell}>
                  <textarea
                    className={styles.noteTextarea}
                    value={adminNoteDrafts[item.id] ?? ""}
                    placeholder="Внутренняя заметка специалиста"
                    disabled={isUpdating}
                    onChange={(event) =>
                      onAdminNoteChange(item.id, event.target.value)
                    }
                  />
                </td>

                <td className={styles.actionCell}>
                  <div className={styles.actionsStack}>
                    <button
                      className={styles.detailsButton}
                      type="button"
                      onClick={() => setSelectedReview(item)}
                    >
                      Подробнее
                    </button>

                    {item.status !== "published" ? (
                      <AdminButton
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => void onUpdateReview(item, "published")}
                      >
                        Опубликовать
                      </AdminButton>
                    ) : null}

                    {item.status !== "hidden" ? (
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => void onUpdateReview(item, "hidden")}
                      >
                        Скрыть
                      </AdminButton>
                    ) : null}

                    {item.status === "deleted" ? (
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => void onUpdateReview(item, "hidden")}
                      >
                        Восстановить
                      </AdminButton>
                    ) : (
                      <AdminButton
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => void onUpdateReview(item, "deleted")}
                      >
                        Удалить
                      </AdminButton>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>

      {selectedReview ? (
        <ReviewDetailsModal
          adminNote={adminNoteDrafts[selectedReview.id] ?? ""}
          item={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      ) : null}
    </>
  );
}