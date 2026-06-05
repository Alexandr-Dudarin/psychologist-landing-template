import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { AdminSection } from "../../../components/admin/AdminSection";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import {
  getAdminClientReviews,
  updateAdminClientReview,
} from "../../../lib/api/adminClients";
import type {
  ClientReviewAdminRecord,
  ClientReviewAdminStatusFilter,
  ClientReviewStatus,
} from "../../../types/reviews";
import { AdminReviewsTable } from "./AdminReviewsTable";
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
        <CustomSelect
          ariaLabel="Фильтр отзывов по статусу"
          className={styles.statusFilter}
          dropdownWidth="trigger"
          layout="filter"
          options={statusOptions}
          value={statusFilter}
          variant="admin"
          onChange={handleStatusChange}
        />

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
          <AdminReviewsTable
            adminNoteDrafts={adminNoteDrafts}
            items={items}
            updatingId={updatingId}
            onAdminNoteChange={handleAdminNoteChange}
            onUpdateReview={handleUpdateReview}
          />
        )}
      </AdminSection>
    </main>
  );
}