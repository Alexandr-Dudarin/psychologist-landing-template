import { AdminButton } from "../../../components/admin/AdminButton";

import styles from "./SessionsPage.module.css";

type SessionsQuickViewBannerProps = {
  clientFilter: number | "all";
  highlightedSessionId: number | null;
  searchQuery: string;
  onResetView: () => void;
};

export function SessionsQuickViewBanner({
  clientFilter,
  highlightedSessionId,
  searchQuery,
  onResetView,
}: SessionsQuickViewBannerProps) {
  const trimmedSearchQuery = searchQuery.trim();

  return (
    <div className={styles.quickViewBanner}>
      <div className={styles.quickViewText}>
        <div className={styles.quickViewTitle}>Режим быстрого перехода</div>
        <div className={styles.quickViewList}>
          {clientFilter !== "all" ? (
            <span className={styles.quickViewChip}>Клиент</span>
          ) : null}
          {highlightedSessionId !== null ? (
            <span className={styles.quickViewChip}>Сессия</span>
          ) : null}
          {trimmedSearchQuery ? (
            <span className={styles.quickViewChip}>
              Поиск: {trimmedSearchQuery}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.quickViewActions}>
        <AdminButton type="button" variant="secondary" onClick={onResetView}>
          Показать все сессии
        </AdminButton>
      </div>
    </div>
  );
}