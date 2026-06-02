import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useLanguage } from "../../../app/providers/LanguageProvider";
import { createClientFromRequest } from "../../../lib/api/adminClients";
import {
  getAdminRequests,
  getAdminRequestsPage,
  markAdminRequestsViewed,
  updateAdminRequestStatus,
} from "../../../lib/api/adminRequests";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import type { CrmRequestRecord, RequestStatus } from "../../../types/request";
import { requestStatuses } from "../../../types/request";
import { RequestsFilters } from "./RequestsFilters";
import { RequestsTable } from "./RequestsTable";
import styles from "./RequestsPage.module.css";

const OLD_REQUESTS_PAGE_SIZE = 100;

function mergeViewedRequests(
  items: CrmRequestRecord[],
  viewedItems: Array<{ id: number; viewedAt: string }>
): CrmRequestRecord[] {
  if (viewedItems.length === 0) {
    return items;
  }

  const viewedAtById = new Map(
    viewedItems.map((item) => [item.id, item.viewedAt])
  );

  return items.map((item) => {
    const viewedAt = viewedAtById.get(item.id);

    if (!viewedAt) {
      return item;
    }

    return {
      ...item,
      viewedAt,
    };
  });
}

export function RequestsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmRequestRecord[]>([]);
  const [oldItems, setOldItems] = useState<CrmRequestRecord[]>([]);
  const [newRequestIds, setNewRequestIds] = useState<Set<number>>(
    () => new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOldRequestsOpen, setIsOldRequestsOpen] = useState(false);
  const [isOldRequestsLoading, setIsOldRequestsLoading] = useState(false);
  const [oldRequestsHasMore, setOldRequestsHasMore] = useState(false);
  const [oldRequestsError, setOldRequestsError] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creatingClientId, setCreatingClientId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedRequestId, setHighlightedRequestId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    const highlightFromUrl = searchParams.get("highlightRequestId");

    setSearchQuery(searchFromUrl ?? "");

    if (highlightFromUrl !== null) {
      const parsedId = Number(highlightFromUrl);

      setHighlightedRequestId(
        Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
      );
      setStatusFilter("all");
    } else {
      setHighlightedRequestId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const requests = await getAdminRequests({
          status: statusFilter,
          search: searchQuery,
          scope: highlightedRequestId !== null ? "all" : "active",
        });

        if (!isMounted) {
          return;
        }

        const unviewedRequestIds = requests
          .filter((request) => request.viewedAt === null)
          .map((request) => request.id);

        setItems(requests);

        if (unviewedRequestIds.length > 0) {
          setNewRequestIds((current) => {
            const next = new Set(current);

            unviewedRequestIds.forEach((requestId) => {
              next.add(requestId);
            });

            return next;
          });
        }

        if (unviewedRequestIds.length > 0) {
          try {
            const viewedItems = await markAdminRequestsViewed(unviewedRequestIds);

            if (!isMounted) {
              return;
            }

            setItems((current) => mergeViewedRequests(current, viewedItems));
            setOldItems((current) => mergeViewedRequests(current, viewedItems));
          } catch (markViewedError) {
            if (isMounted) {
              setError(
                markViewedError instanceof Error
                  ? markViewedError.message
                  : "Не удалось пометить новые заявки просмотренными."
              );
            }
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t.admin.requests.messages.loadError
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [
    statusFilter,
    searchQuery,
    highlightedRequestId,
    t.admin.requests.messages.loadError,
  ]);

  useEffect(() => {
    if (!isOldRequestsOpen) {
      setOldItems([]);
      setOldRequestsHasMore(false);
      setOldRequestsError("");
      return;
    }

    let isMounted = true;

    async function loadOldRequests() {
      try {
        setIsOldRequestsLoading(true);
        setOldRequestsError("");

        const result = await getAdminRequestsPage({
          status: statusFilter,
          search: searchQuery,
          scope: "old",
          limit: OLD_REQUESTS_PAGE_SIZE,
          offset: 0,
        });

        if (isMounted) {
          setOldItems(result.items);
          setOldRequestsHasMore(result.hasMore);
        }
      } catch (loadError) {
        if (isMounted) {
          setOldRequestsError(
            loadError instanceof Error
              ? loadError.message
              : t.admin.requests.messages.loadError
          );
        }
      } finally {
        if (isMounted) {
          setIsOldRequestsLoading(false);
        }
      }
    }

    loadOldRequests();

    return () => {
      isMounted = false;
    };
  }, [
    isOldRequestsOpen,
    statusFilter,
    searchQuery,
    t.admin.requests.messages.loadError,
  ]);

  const newItems = useMemo(
    () => items.filter((item) => newRequestIds.has(item.id)),
    [items, newRequestIds]
  );

  const regularItems = useMemo(
    () => items.filter((item) => !newRequestIds.has(item.id)),
    [items, newRequestIds]
  );

  const handleStatusChange = async (
    requestId: number,
    nextStatus: RequestStatus
  ) => {
    const previousItems = items;
    const previousOldItems = oldItems;

    setItems((current) =>
      current.map((item) =>
        item.id === requestId ? { ...item, status: nextStatus } : item
      )
    );
    setOldItems((current) =>
      current.map((item) =>
        item.id === requestId ? { ...item, status: nextStatus } : item
      )
    );

    setSavingId(requestId);
    setError("");
    setSuccessMessage("");
    setOldRequestsError("");

    try {
      await updateAdminRequestStatus({
        id: requestId,
        status: nextStatus,
      });
    } catch (updateError) {
      setItems(previousItems);
      setOldItems(previousOldItems);
      setError(
        updateError instanceof Error
          ? updateError.message
          : t.admin.requests.messages.updateStatusError
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateClient = async (requestId: number) => {
    const currentRequest =
      items.find((item) => item.id === requestId) ??
      oldItems.find((item) => item.id === requestId);

    if (!currentRequest || currentRequest.clientId !== null) {
      return;
    }

    setCreatingClientId(requestId);
    setError("");
    setSuccessMessage("");
    setOldRequestsError("");

    try {
      const result = await createClientFromRequest(requestId);

      setItems((current) =>
        current.map((item) =>
          item.id === requestId ? { ...item, clientId: result.item.id } : item
        )
      );

      setOldItems((current) =>
        current.map((item) =>
          item.id === requestId ? { ...item, clientId: result.item.id } : item
        )
      );

      setSuccessMessage(
        result.alreadyExisted
          ? "Заявка привязана к существующему клиенту."
          : "Клиент создан из заявки."
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t.admin.requests.messages.createClientError
      );
    } finally {
      setCreatingClientId(null);
    }
  };

  const handleLoadMoreOldRequests = async () => {
    try {
      setIsOldRequestsLoading(true);
      setOldRequestsError("");

      const result = await getAdminRequestsPage({
        status: statusFilter,
        search: searchQuery,
        scope: "old",
        limit: OLD_REQUESTS_PAGE_SIZE,
        offset: oldItems.length,
      });

      setOldItems((current) => [...current, ...result.items]);
      setOldRequestsHasMore(result.hasMore);
    } catch (loadError) {
      setOldRequestsError(
        loadError instanceof Error
          ? loadError.message
          : t.admin.requests.messages.loadError
      );
    } finally {
      setIsOldRequestsLoading(false);
    }
  };

  const handleResetView = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setHighlightedRequestId(null);
    navigate("/admin/requests");
  };

  const statusOptions = requestStatuses.map((status) => ({
    value: status,
    label: t.admin.requests.statusLabels[status],
  }));

  const hasQuickViewState =
    highlightedRequestId !== null || searchQuery.trim().length > 0;

  const hasActiveFilters =
    statusFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    highlightedRequestId !== null;

  const isInitialLoading = isLoading && items.length === 0;
  const hasTableSnapshot = items.length > 0;
  const hasNewRequests = newItems.length > 0;
  const shouldShowBottomOldRequestsHideButton = oldItems.length > 10;

  const oldRequestsToggleLabel = isOldRequestsOpen
    ? "Скрыть заявки старше 32 дней"
    : "Показать заявки старше 32 дней";

  const oldRequestsToggleCompactLabel = isOldRequestsOpen
    ? "Скрыть старые заявки"
    : "Показать старые заявки";

  return (
    <main>
      <h1>{t.admin.requests.title}</h1>

      <RequestsFilters
        allStatusesLabel={t.admin.requests.filters.allStatuses}
        searchPlaceholder={t.admin.requests.filters.searchPlaceholder}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        hasActiveFilters={hasActiveFilters}
        resetLabel="Сбросить"
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onResetFilters={handleResetView}
      />

      {hasQuickViewState ? (
        <div className={styles.quickViewBanner}>
          <div className={styles.quickViewText}>
            <div className={styles.quickViewTitle}>
              Режим быстрого перехода
            </div>
            <div className={styles.quickViewList}>
              {highlightedRequestId !== null ? (
                <span className={styles.quickViewChip}>Заявка</span>
              ) : null}
              {searchQuery.trim() ? (
                <span className={styles.quickViewChip}>
                  Поиск: {searchQuery.trim()}
                </span>
              ) : null}
            </div>
          </div>

          <div className={styles.quickViewActions}>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={handleResetView}
            >
              Показать все заявки
            </AdminButton>
          </div>
        </div>
      ) : null}

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {isInitialLoading ? (
        <p>{t.admin.requests.messages.loading}</p>
      ) : hasTableSnapshot ? (
        <div className={styles.requestsTableFrame}>
          {isLoading ? (
            <div
              className={styles.refreshNotice}
              role="status"
              aria-live="polite"
            >
              Обновляем список заявок...
            </div>
          ) : null}

          <div className={isLoading ? styles.tableSnapshotRefreshing : undefined}>
            <div className={styles.requestsLists}>
              {hasNewRequests ? (
                <section className={styles.newRequestsSection}>
                  <div className={styles.requestsSectionHeader}>
                    <div>
                      <h2 className={styles.requestsSectionTitle}>
                        Новые заявки
                      </h2>
                      <p className={styles.requestsSectionDescription}>
                        Новые обращения, которые появились с прошлого просмотра
                        страницы. После обновления или повторного входа они
                        останутся в общем списке заявок.
                      </p>
                    </div>

                    <span className={styles.newRequestsCount}>
                      {newItems.length}
                    </span>
                  </div>

                  <RequestsTable
                    items={newItems}
                    savingId={savingId}
                    creatingClientId={creatingClientId}
                    highlightedRequestId={highlightedRequestId}
                    newRequestIds={newRequestIds}
                    statusOptions={statusOptions}
                    createdLabel={t.admin.requests.table.created}
                    nameLabel={t.admin.requests.table.name}
                    phoneLabel={t.admin.requests.table.phone}
                    emailLabel={t.admin.requests.table.email}
                    messageLabel={t.admin.requests.table.message}
                    statusLabel={t.admin.requests.table.status}
                    clientLabel={t.admin.requests.table.client}
                    actionsSavingLabel={t.admin.requests.actions.saving}
                    actionsCreateClientLabel={t.admin.requests.actions.createClient}
                    actionsCreatingClientLabel={
                      t.admin.requests.actions.creatingClient
                    }
                    actionsCreatedLabel={t.admin.requests.actions.created}
                    onStatusChange={handleStatusChange}
                    onCreateClient={handleCreateClient}
                  />
                </section>
              ) : null}

              {regularItems.length > 0 ? (
                <section className={styles.regularRequestsSection}>
                  {hasNewRequests ? (
                    <div className={styles.requestsSectionHeader}>
                      <div>
                        <h2 className={styles.requestsSectionTitle}>
                          Остальные заявки
                        </h2>
                        <p className={styles.requestsSectionDescription}>
                          Активные заявки за последние 32 дня.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <RequestsTable
                    items={regularItems}
                    savingId={savingId}
                    creatingClientId={creatingClientId}
                    highlightedRequestId={highlightedRequestId}
                    newRequestIds={newRequestIds}
                    statusOptions={statusOptions}
                    createdLabel={t.admin.requests.table.created}
                    nameLabel={t.admin.requests.table.name}
                    phoneLabel={t.admin.requests.table.phone}
                    emailLabel={t.admin.requests.table.email}
                    messageLabel={t.admin.requests.table.message}
                    statusLabel={t.admin.requests.table.status}
                    clientLabel={t.admin.requests.table.client}
                    actionsSavingLabel={t.admin.requests.actions.saving}
                    actionsCreateClientLabel={t.admin.requests.actions.createClient}
                    actionsCreatingClientLabel={
                      t.admin.requests.actions.creatingClient
                    }
                    actionsCreatedLabel={t.admin.requests.actions.created}
                    onStatusChange={handleStatusChange}
                    onCreateClient={handleCreateClient}
                  />
                </section>
              ) : hasNewRequests ? (
                <p className={styles.empty}>
                  Остальных заявок по текущим фильтрам нет.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p>{t.admin.requests.messages.empty}</p>
      )}

      <section className={styles.oldRequestsPanel}>
        <div className={styles.oldRequestsCard}>
          <div className={styles.oldRequestsText}>
            <h2 className={styles.oldRequestsTitle}>Заявки старше 32 дней</h2>
            <p className={styles.oldRequestsDescription}>
              Старые заявки загружаются отдельно, чтобы основной список оставался
              быстрым и не перегружал страницу.
            </p>
          </div>

          <AdminButton
            type="button"
            variant="secondary"
            className={styles.oldRequestsToggleButton}
            onClick={() => setIsOldRequestsOpen((current) => !current)}
          >
            <span className={styles.oldRequestsFullLabel}>
              {oldRequestsToggleLabel}
            </span>
            <span className={styles.oldRequestsCompactLabel}>
              {oldRequestsToggleCompactLabel}
            </span>
          </AdminButton>
        </div>

        {isOldRequestsOpen ? (
          <div className={styles.oldRequestsContent}>
            <AdminFeedback message={oldRequestsError} tone="error" />

            {isOldRequestsLoading && oldItems.length === 0 ? (
              <p className={styles.empty}>Загружаем старые заявки...</p>
            ) : oldItems.length > 0 ? (
              <>
                <div
                  className={`${styles.requestsTableFrame} ${styles.oldRequestsTableFrame}`}
                >
                  {isOldRequestsLoading ? (
                    <div
                      className={styles.refreshNotice}
                      role="status"
                      aria-live="polite"
                    >
                      Обновляем список заявок...
                    </div>
                  ) : null}

                  <div
                    className={
                      isOldRequestsLoading
                        ? styles.tableSnapshotRefreshing
                        : undefined
                    }
                  >
                    <RequestsTable
                      items={oldItems}
                      savingId={savingId}
                      creatingClientId={creatingClientId}
                      highlightedRequestId={null}
                      isStatusChangeDisabled={true}
                      statusOptions={statusOptions}
                      createdLabel={t.admin.requests.table.created}
                      nameLabel={t.admin.requests.table.name}
                      phoneLabel={t.admin.requests.table.phone}
                      emailLabel={t.admin.requests.table.email}
                      messageLabel={t.admin.requests.table.message}
                      statusLabel={t.admin.requests.table.status}
                      clientLabel={t.admin.requests.table.client}
                      actionsSavingLabel={t.admin.requests.actions.saving}
                      actionsCreateClientLabel={
                        t.admin.requests.actions.createClient
                      }
                      actionsCreatingClientLabel={
                        t.admin.requests.actions.creatingClient
                      }
                      actionsCreatedLabel={t.admin.requests.actions.created}
                      onStatusChange={handleStatusChange}
                      onCreateClient={handleCreateClient}
                    />
                  </div>
                </div>

                {oldRequestsHasMore ||
                  shouldShowBottomOldRequestsHideButton ? (
                  <div className={styles.oldRequestsFooterActions}>
                    {oldRequestsHasMore ? (
                      <AdminButton
                        type="button"
                        variant="secondary"
                        onClick={handleLoadMoreOldRequests}
                        disabled={isOldRequestsLoading}
                      >
                        {isOldRequestsLoading
                          ? "Загружаем..."
                          : "Показать ещё 100"}
                      </AdminButton>
                    ) : null}

                    {shouldShowBottomOldRequestsHideButton ? (
                      <AdminButton
                        type="button"
                        variant="secondary"
                        className={styles.oldRequestsToggleButton}
                        onClick={() => setIsOldRequestsOpen(false)}
                      >
                        <span className={styles.oldRequestsFullLabel}>
                          Скрыть заявки старше 32 дней
                        </span>
                        <span className={styles.oldRequestsCompactLabel}>
                          Скрыть старые заявки
                        </span>
                      </AdminButton>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className={styles.empty}>
                Старых заявок по текущим фильтрам нет.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}