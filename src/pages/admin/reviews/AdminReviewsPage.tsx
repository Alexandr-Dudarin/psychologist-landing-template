import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import {
  getAdminClientReviews,
  updateAdminClientReview,
} from "../../../lib/api/adminClients";
import type {
  ClientReviewAdminRecord,
  ClientReviewAdminStatusFilter,
  ClientReviewStatus,
} from "../../../types/reviews";
import styles from "./AdminReviewsPage.module.css";

const statusOptions: Array<{
  value: ClientReviewAdminStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "На проверке" },
  { value: "published", label: "Опубликованы" },
  { value: "hidden", label: "Скрыты" },
  { value: "deleted", label: "Удалены" },
];

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

function getRatingLabel(rating: number | null): string {
  if (rating === null) {
    return "Без оценки";
  }

  return `${rating} из 5`;
}

function getPublicName(value: string): string {
  return value.trim() || "Анонимный отзыв";
}

export function AdminReviewsPage() {
  const [items, setItems] = useState<ClientReviewAdminRecord[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<ClientReviewAdminStatusFilter>("all");
  const [adminNoteDrafts, setAdminNoteDrafts] = useState<
    Record<number, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items]
  );

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const loadedItems = await getAdminClientReviews(statusFilter);

      setItems(loadedItems);
      setAdminNoteDrafts(
        loadedItems.reduce<Record<number, string>>((acc, item) => {
          acc[item.id] = item.adminNote;
          return acc;
        }, {})
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить отзывы"
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ClientReviewAdminStatusFilter);
  };

  const handleAdminNoteChange = (id: number, value: string) => {
    setAdminNoteDrafts((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const handleUpdateReview = async (
    item: ClientReviewAdminRecord,
    status: ClientReviewStatus
  ) => {
    setUpdatingId(item.id);
    setError("");
    setSuccessMessage("");

    try {
      const updatedItem = await updateAdminClientReview({
        id: item.id,
        status,
        adminNote: adminNoteDrafts[item.id] ?? "",
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem
        )
      );
      setAdminNoteDrafts((currentDrafts) => ({
        ...currentDrafts,
        [updatedItem.id]: updatedItem.adminNote,
      }));
      setSuccessMessage("Отзыв обновлён.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить отзыв"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main>
      <h1>Отзывы клиентов</h1>

      <div className={styles.summaryBar}>
        <div className={styles.summaryText}>
          <h2 className={styles.summaryTitle}>Модерация отзывов</h2>
          <p className={styles.summaryDescription}>
            Здесь специалист видит, кто оставил отзыв, может проверить текст,
            опубликовать его на сайте, скрыть или удалить из публичного показа.
          </p>
        </div>

        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => void loadReviews()}
          disabled={isLoading}
        >
          {isLoading ? "Обновление..." : "Обновить"}
        </AdminButton>
      </div>

      <AdminFiltersRow>
        <select
          className={styles.statusFilter}
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className={styles.pendingCounter}>
          На проверке: <strong>{pendingCount}</strong>
        </div>
      </AdminFiltersRow>

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      <AdminSection>
        {isLoading ? (
          <p className={styles.mutedText}>Загрузка отзывов...</p>
        ) : items.length === 0 ? (
          <p className={styles.mutedText}>Отзывов с таким статусом пока нет.</p>
        ) : (
          <AdminTable
            withTopMargin={false}
            tableClassName={styles.reviewsTable}
          >
            <thead>
              <tr>
                <th className={styles.reviewCell}>Отзыв</th>
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
                  <tr
                    key={item.id}
                    className={
                      item.status === "deleted" ? styles.deletedRow : undefined
                    }
                  >
                    <td className={styles.reviewCell}>
                      <div className={styles.reviewPreview}>
                        <div className={styles.reviewHeader}>
                          <strong>{getPublicName(item.publicName)}</strong>
                          <span>{getRatingLabel(item.rating)}</span>
                        </div>

                        <p className={styles.reviewText}>{item.text}</p>
                      </div>
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
                          handleAdminNoteChange(item.id, event.target.value)
                        }
                      />
                    </td>

                    <td className={styles.actionCell}>
                      <div className={styles.actionsStack}>
                        {item.status !== "published" ? (
                          <AdminButton
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() =>
                              void handleUpdateReview(item, "published")
                            }
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
                            onClick={() => void handleUpdateReview(item, "hidden")}
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
                            onClick={() => void handleUpdateReview(item, "hidden")}
                          >
                            Восстановить
                          </AdminButton>
                        ) : (
                          <AdminButton
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() =>
                              void handleUpdateReview(item, "deleted")
                            }
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
        )}
      </AdminSection>
    </main>
  );
}