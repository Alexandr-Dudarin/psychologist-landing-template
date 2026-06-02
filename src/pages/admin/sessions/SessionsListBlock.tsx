import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminRefreshableTableArea } from "../../../components/admin/AdminRefreshableTableArea";
import type {
  ClientFavoriteFilter,
  CrmClientRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { CrmSessionRecord, SessionStatus } from "../../../types/session";
import { SessionsFilters } from "./SessionsFilters";
import { SessionsTable } from "./SessionsTable";
import styles from "./SessionsPage.module.css";

export type SessionsListBlockProps = {
  archivedSessionsHasMore: boolean;
  canToggleArchivedSessions: boolean;
  clientFilter: number | "all";
  clients: CrmClientRecord[];
  dateFilter: string | null;
  deletingId: number | null;
  displayedActiveItems: CrmSessionRecord[];
  displayedArchivedItems: CrmSessionRecord[];
  error: string;
  favoriteFilter: ClientFavoriteFilter;
  hasActiveFilters: boolean;
  highlightedSessionId: number | null;
  isActiveSessionsInitialLoading: boolean;
  isActiveSessionsRefreshing: boolean;
  isArchivedSessionsInitialLoading: boolean;
  isArchivedSessionsRefreshing: boolean;
  scheduleTimezone: string;
  serviceFilter: number | "all";
  services: CrmServiceRecord[];
  shouldDisplayArchivedSessions: boolean;
  shouldLoadActiveSessions: boolean;
  shouldShowArchivedPanel: boolean;
  showArchivedSessions: boolean;
  statusFilter: SessionStatus | "all";
  successMessage: string;
  onClientFilterChange: (value: number | "all") => void;
  onDateFilterChange: (value: string) => void;
  onDateTodayClick: () => void;
  onDeleteSession: (id: number) => void;
  onEditSession: (session: CrmSessionRecord) => void;
  onFavoriteFilterChange: (value: ClientFavoriteFilter) => void;
  onHideArchivedSessions: () => void;
  onLoadMoreArchivedSessions: () => void;
  onResetView: () => void;
  onServiceFilterChange: (value: number | "all") => void;
  onShowArchivedSessions: () => void;
  onStatusFilterChange: (value: SessionStatus | "all") => void;
};

export function SessionsListBlock({
  archivedSessionsHasMore,
  canToggleArchivedSessions,
  clientFilter,
  clients,
  dateFilter,
  deletingId,
  displayedActiveItems,
  displayedArchivedItems,
  error,
  favoriteFilter,
  hasActiveFilters,
  highlightedSessionId,
  isActiveSessionsInitialLoading,
  isActiveSessionsRefreshing,
  isArchivedSessionsInitialLoading,
  isArchivedSessionsRefreshing,
  scheduleTimezone,
  serviceFilter,
  services,
  shouldDisplayArchivedSessions,
  shouldLoadActiveSessions,
  shouldShowArchivedPanel,
  showArchivedSessions,
  statusFilter,
  successMessage,
  onClientFilterChange,
  onDateFilterChange,
  onDateTodayClick,
  onDeleteSession,
  onEditSession,
  onFavoriteFilterChange,
  onHideArchivedSessions,
  onLoadMoreArchivedSessions,
  onResetView,
  onServiceFilterChange,
  onShowArchivedSessions,
  onStatusFilterChange,
}: SessionsListBlockProps) {
  const shouldShowArchivedFooterActions =
    shouldDisplayArchivedSessions &&
    displayedArchivedItems.length > 0 &&
    (archivedSessionsHasMore ||
      (canToggleArchivedSessions && displayedArchivedItems.length > 10));

  return (
    <>
      <SessionsFilters
        clientFilter={clientFilter}
        clients={clients}
        dateFilter={dateFilter}
        favoriteFilter={favoriteFilter}
        serviceFilter={serviceFilter}
        services={services}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        onClientFilterChange={onClientFilterChange}
        onDateFilterChange={onDateFilterChange}
        onDateTodayClick={onDateTodayClick}
        onFavoriteFilterChange={onFavoriteFilterChange}
        onServiceFilterChange={onServiceFilterChange}
        onStatusFilterChange={onStatusFilterChange}
        onResetFilters={onResetView}
      />

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {shouldLoadActiveSessions ? (
        <AdminRefreshableTableArea isRefreshing={isActiveSessionsRefreshing}>
          <SessionsTable
            items={displayedActiveItems}
            isLoading={isActiveSessionsInitialLoading}
            deletingId={deletingId}
            timezone={scheduleTimezone}
            highlightedSessionId={highlightedSessionId}
            emptyMessage="Запланированных сессий пока нет."
            onEdit={onEditSession}
            onDelete={onDeleteSession}
          />
        </AdminRefreshableTableArea>
      ) : null}

      {shouldShowArchivedPanel ? (
        <section className={styles.archivedSessionsPanel}>
          <div className={styles.archivedSessionsText}>
            <h2 className={styles.archivedSessionsTitle}>
              Завершённые сессии
            </h2>
            <p className={styles.archivedSessionsHint}>
              Проведённые, отменённые сессии и неявки загружаются отдельно.
              Фильтры по клиенту, дате, статусу и услуге применяются и к этому
              списку тоже.
            </p>
          </div>

          {canToggleArchivedSessions ? (
            <AdminButton
              type="button"
              variant="secondary"
              onClick={
                showArchivedSessions
                  ? onHideArchivedSessions
                  : onShowArchivedSessions
              }
            >
              {showArchivedSessions
                ? "Скрыть завершённые"
                : "Показать завершённые"}
            </AdminButton>
          ) : null}
        </section>
      ) : null}

      {shouldDisplayArchivedSessions ? (
        <>
          <AdminRefreshableTableArea isRefreshing={isArchivedSessionsRefreshing}>
            <SessionsTable
              items={displayedArchivedItems}
              isLoading={isArchivedSessionsInitialLoading}
              deletingId={deletingId}
              timezone={scheduleTimezone}
              highlightedSessionId={highlightedSessionId}
              emptyMessage="Завершённых сессий пока нет."
              onEdit={onEditSession}
              onDelete={onDeleteSession}
            />
          </AdminRefreshableTableArea>

          {shouldShowArchivedFooterActions ? (
            <div className={styles.archivedSessionsFooterActions}>
              {archivedSessionsHasMore ? (
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={onLoadMoreArchivedSessions}
                  disabled={isArchivedSessionsRefreshing}
                >
                  {isArchivedSessionsRefreshing
                    ? "Загружаем..."
                    : "Показать ещё 100"}
                </AdminButton>
              ) : null}

              {canToggleArchivedSessions && displayedArchivedItems.length > 10 ? (
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={onHideArchivedSessions}
                >
                  Скрыть завершённые
                </AdminButton>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}