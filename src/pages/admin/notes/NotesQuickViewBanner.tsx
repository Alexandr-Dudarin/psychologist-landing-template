import { AdminButton } from "../../../components/admin/AdminButton";
import styles from "./NotesPage.module.css";
import type { NotesPageFilterValue } from "./notesPageHelpers";

type NotesQuickViewBannerProps = {
  clientFilter: NotesPageFilterValue;
  sessionFilter: NotesPageFilterValue;
  searchQuery: string;
  onReset: () => void;
};

export function NotesQuickViewBanner({
  clientFilter,
  sessionFilter,
  searchQuery,
  onReset,
}: NotesQuickViewBannerProps) {
  const trimmedSearchQuery = searchQuery.trim();

  return (
    <div className={styles.quickViewBanner}>
      <div className={styles.quickViewText}>
        <div className={styles.quickViewTitle}>Режим быстрого перехода</div>
        <div className={styles.quickViewList}>
          {clientFilter !== "all" ? (
            <span className={styles.quickViewChip}>Клиент #{clientFilter}</span>
          ) : null}
          {sessionFilter !== "all" ? (
            <span className={styles.quickViewChip}>Сессия #{sessionFilter}</span>
          ) : null}
          {trimmedSearchQuery ? (
            <span className={styles.quickViewChip}>
              Поиск: {trimmedSearchQuery}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.quickViewActions}>
        <AdminButton type="button" variant="secondary" onClick={onReset}>
          Показать все заметки
        </AdminButton>
      </div>
    </div>
  );
}
