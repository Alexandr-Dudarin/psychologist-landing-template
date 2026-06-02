import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getDefaultBookingTimezone,
  resolveBookingTimezone,
} from "../../../lib/booking/bookingTimezones";
import { getAdminSchedule } from "../../../lib/api/adminSchedule";
import {
  getAdminClients,
  getClientServicePackages,
} from "../../../lib/api/adminClients";
import { getAdminServices } from "../../../lib/api/adminServices";
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSessions,
  getAdminSessionsPage,
  updateAdminSession,
} from "../../../lib/api/adminSessions";
import type {
  ClientFavoriteFilter,
  CrmClientRecord,
  CrmClientServicePackageRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { CrmSessionRecord, SessionStatus } from "../../../types/session";
import type { AdminScheduleRecord } from "../../../types/schedule";
import {
  initialCreateForm,
  initialEditForm,
  type SessionForm,
} from "./sessionForm";
import { SessionsFormBlock } from "./SessionsFormBlock";
import {
  buildCreateSessionPayload,
  buildEditSessionForm,
  buildUpdateSessionPayload,
  filterSessionsByFavoriteClients,
  getManualSessionScheduleWarning,
  getParsedClientId,
  isArchivedStatus,
  updateSessionFormField,
} from "./sessionsPageHelpers";
import {
  validateCreateSessionPayload,
  validateUpdateSessionPayload,
} from "./sessionsPageValidation";
import { SessionsListBlock } from "./SessionsListBlock";
import { SessionsQuickViewBanner } from "./SessionsQuickViewBanner";

const createFormPanelId = "session-create-form-panel";

const ARCHIVED_SESSIONS_PAGE_SIZE = 100;

function normalizeDateFilter(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function getSessionDateKey(
  scheduledAt: string,
  timezone: string
): string | null {
  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      return null;
    }

    return `${year}-${month}-${day}`;
  } catch {
    return scheduledAt.slice(0, 10);
  }
}

function filterSessionsByDate(
  sessions: CrmSessionRecord[],
  dateFilter: string | null,
  timezone: string
): CrmSessionRecord[] {
  if (!dateFilter) {
    return sessions;
  }

  return sessions.filter(
    (session) => getSessionDateKey(session.scheduledAt, timezone) === dateFilter
  );
}

export function SessionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmSessionRecord[]>([]);
  const [archivedItems, setArchivedItems] = useState<CrmSessionRecord[]>([]);
  const [lastVisibleItems, setLastVisibleItems] = useState<CrmSessionRecord[]>(
    []
  );
  const [lastVisibleArchivedItems, setLastVisibleArchivedItems] = useState<
    CrmSessionRecord[]
  >([]);
  const [lastStableVisibleItems, setLastStableVisibleItems] = useState<
    CrmSessionRecord[]
  >([]);
  const [hasLoadedActiveSessionsOnce, setHasLoadedActiveSessionsOnce] =
    useState(false);
  const [hasLoadedArchivedSessionsOnce, setHasLoadedArchivedSessionsOnce] =
    useState(false);
  const [hasLoadedAnySessionsOnce, setHasLoadedAnySessionsOnce] =
    useState(false);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [services, setServices] = useState<CrmServiceRecord[]>([]);
  const [createClientPackages, setCreateClientPackages] = useState<
    CrmClientServicePackageRecord[]
  >([]);
  const [editClientPackages, setEditClientPackages] = useState<
    CrmClientServicePackageRecord[]
  >([]);
  const [isCreatePackagesLoading, setIsCreatePackagesLoading] = useState(false);
  const [isEditPackagesLoading, setIsEditPackagesLoading] = useState(false);
  const [scheduleTimezone, setScheduleTimezone] = useState(
    getDefaultBookingTimezone()
  );
  const [scheduleRules, setScheduleRules] = useState<
    AdminScheduleRecord["rules"]
  >([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<
    AdminScheduleRecord["overrides"]
  >([]);
  const [scheduleBlockedSlots, setScheduleBlockedSlots] = useState<
    AdminScheduleRecord["blockedSlots"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchivedLoading, setIsArchivedLoading] = useState(false);
  const [showArchivedSessions, setShowArchivedSessions] = useState(false);
  const [archivedSessionsHasMore, setArchivedSessionsHasMore] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState<number | "all">("all");
  const [favoriteFilter, setFavoriteFilter] =
    useState<ClientFavoriteFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [highlightedSessionId, setHighlightedSessionId] = useState<number | null>(
    null
  );
  const [createForm, setCreateForm] = useState<SessionForm>(initialCreateForm);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SessionForm>(initialEditForm);
  const [editingOriginalScheduledAt, setEditingOriginalScheduledAt] = useState<
    string | null
  >(null);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services]
  );

  const favoriteClientIds = useMemo(
    () =>
      new Set(
        clients
          .filter((client) => client.isFavorite)
          .map((client) => client.id)
      ),
    [clients]
  );

  const visibleItems = useMemo(
    () =>
      filterSessionsByDate(
        filterSessionsByFavoriteClients(items, favoriteClientIds, favoriteFilter),
        dateFilter,
        scheduleTimezone
      ),
    [dateFilter, favoriteClientIds, favoriteFilter, items, scheduleTimezone]
  );

  const visibleArchivedItems = useMemo(
    () =>
      filterSessionsByDate(
        filterSessionsByFavoriteClients(
          archivedItems,
          favoriteClientIds,
          favoriteFilter
        ),
        dateFilter,
        scheduleTimezone
      ),
    [
      archivedItems,
      dateFilter,
      favoriteClientIds,
      favoriteFilter,
      scheduleTimezone,
    ]
  );

  const createScheduleWarning = useMemo(
    () =>
      getManualSessionScheduleWarning(
        createForm,
        scheduleRules,
        scheduleOverrides,
        scheduleBlockedSlots
      ),
    [createForm, scheduleRules, scheduleOverrides, scheduleBlockedSlots]
  );

  const isArchivedFilterActive = isArchivedStatus(statusFilter);
  const shouldLoadActiveSessions =
    statusFilter === "all" || statusFilter === "scheduled";
  const shouldShowArchivedPanel =
    statusFilter === "all" || isArchivedFilterActive;
  const shouldDisplayArchivedSessions =
    showArchivedSessions || isArchivedFilterActive;
  const canToggleArchivedSessions = statusFilter === "all";

  useEffect(() => {
    if (!isLoading && shouldLoadActiveSessions) {
      setLastVisibleItems(visibleItems);
      setLastStableVisibleItems(visibleItems);
      setHasLoadedActiveSessionsOnce(true);
      setHasLoadedAnySessionsOnce(true);
    }
  }, [isLoading, shouldLoadActiveSessions, visibleItems]);

  useEffect(() => {
    if (
      !isArchivedLoading &&
      shouldDisplayArchivedSessions &&
      hasLoadedArchivedSessionsOnce
    ) {
      setLastVisibleArchivedItems(visibleArchivedItems);
      setLastStableVisibleItems(visibleArchivedItems);
      setHasLoadedAnySessionsOnce(true);
    }
  }, [
    hasLoadedArchivedSessionsOnce,
    isArchivedLoading,
    shouldDisplayArchivedSessions,
    visibleArchivedItems,
  ]);

  useEffect(() => {
    const clientIdFromUrl = searchParams.get("clientId");
    const searchFromUrl = searchParams.get("search");
    const dateFromUrl = normalizeDateFilter(searchParams.get("date"));
    const highlightSessionFromUrl = searchParams.get("highlightSessionId");

    if (clientIdFromUrl !== null) {
      const parsedClientId = Number(clientIdFromUrl);

      setClientFilter(
        Number.isInteger(parsedClientId) && parsedClientId > 0
          ? parsedClientId
          : "all"
      );
    } else {
      setClientFilter("all");
    }

    setSearchQuery(searchFromUrl ?? "");
    setDateFilter(dateFromUrl);

    if (highlightSessionFromUrl !== null) {
      const parsedSessionId = Number(highlightSessionFromUrl);

      setHighlightedSessionId(
        Number.isInteger(parsedSessionId) && parsedSessionId > 0
          ? parsedSessionId
          : null
      );
    } else {
      setHighlightedSessionId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isArchivedFilterActive) {
      setShowArchivedSessions(true);
      return;
    }

    if (statusFilter === "scheduled") {
      setShowArchivedSessions(false);
      setArchivedItems([]);
      setArchivedSessionsHasMore(false);
    }
  }, [isArchivedFilterActive, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const activeSessionsPromise: Promise<CrmSessionRecord[] | null> =
          shouldLoadActiveSessions
            ? getAdminSessions({
                scope: "active",
                status: statusFilter,
                clientId: clientFilter,
                serviceId: serviceFilter,
                search: searchQuery,
                date: dateFilter,
                timezone: scheduleTimezone,
              })
            : Promise.resolve(null);

        const [sessionsData, clientsData, servicesData, scheduleData] =
          await Promise.all([
            activeSessionsPromise,
            getAdminClients(),
            getAdminServices(),
            getAdminSchedule(),
          ]);

        if (isMounted) {
          if (sessionsData !== null) {
            setItems(sessionsData);
          }

          setClients(clientsData);
          setServices(servicesData);
          setScheduleTimezone(
            resolveBookingTimezone(scheduleData.settings.timezone)
          );
          setScheduleRules(scheduleData.rules);
          setScheduleOverrides(scheduleData.overrides);
          setScheduleBlockedSlots(scheduleData.blockedSlots);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить данные"
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
    clientFilter,
    serviceFilter,
    searchQuery,
    dateFilter,
    scheduleTimezone,
    shouldLoadActiveSessions,
  ]);

  useEffect(() => {
    if (!shouldDisplayArchivedSessions) {
      return;
    }

    let isMounted = true;

    async function loadArchivedSessions() {
      try {
        if (isMounted) {
          setIsArchivedLoading(true);
          setError("");
        }

        const result = await getAdminSessionsPage({
          scope: "archived",
          status: statusFilter,
          clientId: clientFilter,
          serviceId: serviceFilter,
          search: searchQuery,
          date: dateFilter,
          timezone: scheduleTimezone,
          limit: ARCHIVED_SESSIONS_PAGE_SIZE,
          offset: 0,
        });

        if (isMounted) {
          setArchivedItems(result.items);
          setArchivedSessionsHasMore(result.hasMore);
          setHasLoadedArchivedSessionsOnce(true);
          setHasLoadedAnySessionsOnce(true);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить завершённые сессии"
          );
        }
      } finally {
        if (isMounted) {
          setIsArchivedLoading(false);
        }
      }
    }

    loadArchivedSessions();

    return () => {
      isMounted = false;
    };
  }, [
    shouldDisplayArchivedSessions,
    statusFilter,
    clientFilter,
    serviceFilter,
    searchQuery,
    dateFilter,
    scheduleTimezone,
  ]);

  useEffect(() => {
    const clientId = getParsedClientId(createForm.clientId);

    if (clientId === null) {
      setCreateClientPackages([]);
      setIsCreatePackagesLoading(false);
      return;
    }

    const selectedClientId = clientId;
    let isMounted = true;

    async function loadCreateClientPackages() {
      try {
        if (isMounted) {
          setIsCreatePackagesLoading(true);
        }

        const packages = await getClientServicePackages(selectedClientId);

        if (isMounted) {
          setCreateClientPackages(packages);
        }
      } catch (loadError) {
        if (isMounted) {
          setCreateClientPackages([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить пакеты клиента"
          );
        }
      } finally {
        if (isMounted) {
          setIsCreatePackagesLoading(false);
        }
      }
    }

    loadCreateClientPackages();

    return () => {
      isMounted = false;
    };
  }, [createForm.clientId]);

  useEffect(() => {
    const clientId = getParsedClientId(editForm.clientId);

    if (editingSessionId === null || clientId === null) {
      setEditClientPackages([]);
      setIsEditPackagesLoading(false);
      return;
    }

    const selectedClientId = clientId;
    let isMounted = true;

    async function loadEditClientPackages() {
      try {
        if (isMounted) {
          setIsEditPackagesLoading(true);
        }

        const packages = await getClientServicePackages(selectedClientId);

        if (isMounted) {
          setEditClientPackages(packages);
        }
      } catch (loadError) {
        if (isMounted) {
          setEditClientPackages([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить пакеты клиента"
          );
        }
      } finally {
        if (isMounted) {
          setIsEditPackagesLoading(false);
        }
      }
    }

    loadEditClientPackages();

    return () => {
      isMounted = false;
    };
  }, [editingSessionId, editForm.clientId]);

  useEffect(() => {
    if (editingSessionId === null) {
      return;
    }

    window.setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, [editingSessionId]);

  const reloadSessions = async () => {
    const [sessionsData, archivedSessionsData] = await Promise.all([
      shouldLoadActiveSessions
        ? getAdminSessions({
            scope: "active",
            status: statusFilter,
            clientId: clientFilter,
            serviceId: serviceFilter,
            search: searchQuery,
            date: dateFilter,
            timezone: scheduleTimezone,
          })
        : Promise.resolve(null),
      shouldDisplayArchivedSessions
        ? getAdminSessionsPage({
            scope: "archived",
            status: statusFilter,
            clientId: clientFilter,
            serviceId: serviceFilter,
            search: searchQuery,
            date: dateFilter,
            timezone: scheduleTimezone,
            limit: ARCHIVED_SESSIONS_PAGE_SIZE,
            offset: 0,
          })
        : Promise.resolve(null),
    ]);

    if (sessionsData !== null) {
      setItems(sessionsData);
    }

    if (archivedSessionsData !== null) {
      setArchivedItems(archivedSessionsData.items);
      setArchivedSessionsHasMore(archivedSessionsData.hasMore);
      setHasLoadedArchivedSessionsOnce(true);
      setHasLoadedAnySessionsOnce(true);
    }
  };

  const resetFeedback = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleClientFilterChange = (value: number | "all") => {
    setClientFilter(value);
    resetFeedback();
  };

  const handleFavoriteFilterChange = (value: ClientFavoriteFilter) => {
    setFavoriteFilter(value);
    resetFeedback();

    if (value !== "favorites" || clientFilter === "all") {
      return;
    }

    const selectedClient = clients.find((client) => client.id === clientFilter);

    if (!selectedClient?.isFavorite) {
      setClientFilter("all");
    }
  };

  const handleStatusFilterChange = (value: SessionStatus | "all") => {
    setStatusFilter(value);
    resetFeedback();
  };

  const handleServiceFilterChange = (value: number | "all") => {
    setServiceFilter(value);
    resetFeedback();
  };

  const updateDateFilterSearchParam = (nextDateFilter: string | null) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextDateFilter) {
      nextSearchParams.set("date", nextDateFilter);
    } else {
      nextSearchParams.delete("date");
    }

    nextSearchParams.delete("highlightSessionId");

    const nextSearch = nextSearchParams.toString();

    navigate(nextSearch ? `/admin/sessions?${nextSearch}` : "/admin/sessions");
  };

  const handleDateFilterChange = (value: string) => {
    const normalizedDateFilter = normalizeDateFilter(value);

    setDateFilter(normalizedDateFilter);
    setHighlightedSessionId(null);
    resetFeedback();
    updateDateFilterSearchParam(normalizedDateFilter);
  };

  const handleDateTodayClick = () => {
    const todayDateKey =
      getSessionDateKey(new Date().toISOString(), scheduleTimezone) ??
      new Date().toISOString().slice(0, 10);

    setDateFilter(todayDateKey);
    setHighlightedSessionId(null);
    resetFeedback();
    updateDateFilterSearchParam(todayDateKey);
  };

  const handleCreateFormChange = (field: keyof SessionForm, value: string) => {
    setCreateForm((prev) =>
      updateSessionFormField(
        prev,
        field,
        value,
        activeServices,
        createClientPackages
      )
    );
    resetFeedback();
  };

  const handleEditFormChange = (field: keyof SessionForm, value: string) => {
    setEditForm((prev) =>
      updateSessionFormField(
        prev,
        field,
        value,
        activeServices,
        editClientPackages
      )
    );
    resetFeedback();
  };

  const handleCreateSession = async (e: FormEvent) => {
    e.preventDefault();

    const payload = buildCreateSessionPayload(createForm, scheduleTimezone);
    const validationError = validateCreateSessionPayload(
      payload,
      scheduleTimezone
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      await createAdminSession(payload);
      await reloadSessions();
      setCreateForm(initialCreateForm);
      setCreateClientPackages([]);
      setIsCreateFormOpen(false);
      setSuccessMessage(
        payload.clientPackageId
          ? "Сессия создана и связана с пакетом клиента."
          : "Сессия создана."
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Не удалось создать сессию"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (session: CrmSessionRecord) => {
    setEditingSessionId(session.id);
    setEditingOriginalScheduledAt(session.scheduledAt);
    setEditForm(buildEditSessionForm(session, scheduleTimezone));
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingOriginalScheduledAt(null);
    setEditForm(initialEditForm);
    setEditClientPackages([]);
  };

  const handleUpdateSession = async (e: FormEvent) => {
    e.preventDefault();

    if (editingSessionId === null) {
      return;
    }

    const payload = buildUpdateSessionPayload(
      editingSessionId,
      editForm,
      scheduleTimezone
    );
    const validationError = validateUpdateSessionPayload(
      payload,
      scheduleTimezone,
      editingOriginalScheduledAt
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateAdminSession(payload);
      await reloadSessions();
      setSuccessMessage(
        payload.clientPackageId
          ? "Сессия обновлена и связана с пакетом клиента."
          : "Сессия обновлена."
      );
      cancelEditing();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить сессию"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    const confirmed = window.confirm(
      "Удалить сессию? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteAdminSession(id);
      await reloadSessions();

      if (editingSessionId === id) {
        cancelEditing();
      }

      setSuccessMessage("Сессия удалена.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить сессию"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetView = () => {
    setStatusFilter("all");
    setClientFilter("all");
    setFavoriteFilter("all");
    setServiceFilter("all");
    setSearchQuery("");
    setDateFilter(null);
    setHighlightedSessionId(null);
    setShowArchivedSessions(false);
    setArchivedItems([]);
    setArchivedSessionsHasMore(false);
    navigate("/admin/sessions");
  };

  const handleShowArchivedSessions = () => {
    setShowArchivedSessions(true);
  };

  const handleHideArchivedSessions = () => {
    setShowArchivedSessions(false);
    setArchivedItems([]);
    setArchivedSessionsHasMore(false);
  };

  const handleLoadMoreArchivedSessions = async () => {
    if (isArchivedLoading || !archivedSessionsHasMore) {
      return;
    }

    try {
      setIsArchivedLoading(true);
      setError("");

      const result = await getAdminSessionsPage({
        scope: "archived",
        status: statusFilter,
        clientId: clientFilter,
        serviceId: serviceFilter,
        search: searchQuery,
        date: dateFilter,
        timezone: scheduleTimezone,
        limit: ARCHIVED_SESSIONS_PAGE_SIZE,
        offset: archivedItems.length,
      });

      setArchivedItems((current) => [...current, ...result.items]);
      setArchivedSessionsHasMore(result.hasMore);
      setHasLoadedArchivedSessionsOnce(true);
      setHasLoadedAnySessionsOnce(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить ещё завершённые сессии"
      );
    } finally {
      setIsArchivedLoading(false);
    }
  };

  const hasActiveFilters =
    clientFilter !== "all" ||
    favoriteFilter !== "all" ||
    serviceFilter !== "all" ||
    statusFilter !== "all" ||
    dateFilter !== null ||
    searchQuery.trim().length > 0;

  const hasQuickViewState =
    clientFilter !== "all" ||
    highlightedSessionId !== null ||
    searchQuery.trim().length > 0;

  const activeFallbackItems = hasLoadedActiveSessionsOnce
    ? lastVisibleItems
    : lastStableVisibleItems;

  const displayedActiveItems =
    isLoading && hasLoadedAnySessionsOnce ? activeFallbackItems : visibleItems;

  const isActiveSessionsInitialLoading = isLoading && !hasLoadedAnySessionsOnce;
  const isActiveSessionsRefreshing = isLoading && hasLoadedAnySessionsOnce;

  const archivedFallbackItems = hasLoadedArchivedSessionsOnce
    ? lastVisibleArchivedItems
    : lastStableVisibleItems;

  const shouldUseArchivedFallback =
    shouldDisplayArchivedSessions &&
    hasLoadedAnySessionsOnce &&
    (isArchivedLoading || !hasLoadedArchivedSessionsOnce);

  const displayedArchivedItems = shouldUseArchivedFallback
    ? archivedFallbackItems
    : visibleArchivedItems;

  const isArchivedSessionsInitialLoading =
    isArchivedLoading && !hasLoadedAnySessionsOnce;
  const isArchivedSessionsRefreshing =
    shouldDisplayArchivedSessions &&
    hasLoadedAnySessionsOnce &&
    (isArchivedLoading || !hasLoadedArchivedSessionsOnce);

  return (
    <main>
      <h1>Сессии</h1>

      {hasQuickViewState ? (
        <SessionsQuickViewBanner
          clientFilter={clientFilter}
          highlightedSessionId={highlightedSessionId}
          searchQuery={searchQuery}
          onResetView={handleResetView}
        />
      ) : null}

      <SessionsFormBlock
        activeServices={activeServices}
        clients={clients}
        createClientPackages={createClientPackages}
        createForm={createForm}
        createFormPanelId={createFormPanelId}
        createScheduleWarning={createScheduleWarning}
        editClientPackages={editClientPackages}
        editForm={editForm}
        editFormRef={editFormRef}
        editingSessionId={editingSessionId}
        isCreateFormOpen={isCreateFormOpen}
        isCreatePackagesLoading={isCreatePackagesLoading}
        isCreating={isCreating}
        isEditPackagesLoading={isEditPackagesLoading}
        isUpdating={isUpdating}
        scheduleTimezone={scheduleTimezone}
        onCancelEditing={cancelEditing}
        onCreateFormChange={handleCreateFormChange}
        onCreateSession={handleCreateSession}
        onEditFormChange={handleEditFormChange}
        onToggleCreateForm={() => {
          setIsCreateFormOpen((current) => !current);
          resetFeedback();
        }}
        onUpdateSession={handleUpdateSession}
      />

      <SessionsListBlock
        canToggleArchivedSessions={canToggleArchivedSessions}
        archivedSessionsHasMore={archivedSessionsHasMore}
        clientFilter={clientFilter}
        clients={clients}
        deletingId={deletingId}
        displayedActiveItems={displayedActiveItems}
        displayedArchivedItems={displayedArchivedItems}
        error={error}
        favoriteFilter={favoriteFilter}
        hasActiveFilters={hasActiveFilters}
        highlightedSessionId={highlightedSessionId}
        isActiveSessionsInitialLoading={isActiveSessionsInitialLoading}
        isActiveSessionsRefreshing={isActiveSessionsRefreshing}
        isArchivedSessionsInitialLoading={isArchivedSessionsInitialLoading}
        isArchivedSessionsRefreshing={isArchivedSessionsRefreshing}
        scheduleTimezone={scheduleTimezone}
        dateFilter={dateFilter}
        serviceFilter={serviceFilter}
        services={services}
        shouldDisplayArchivedSessions={shouldDisplayArchivedSessions}
        shouldLoadActiveSessions={shouldLoadActiveSessions}
        shouldShowArchivedPanel={shouldShowArchivedPanel}
        showArchivedSessions={showArchivedSessions}
        statusFilter={statusFilter}
        successMessage={successMessage}
        onClientFilterChange={handleClientFilterChange}
        onDeleteSession={handleDeleteSession}
        onEditSession={startEditing}
        onFavoriteFilterChange={handleFavoriteFilterChange}
        onHideArchivedSessions={handleHideArchivedSessions}
        onLoadMoreArchivedSessions={handleLoadMoreArchivedSessions}
        onResetView={handleResetView}
        onDateFilterChange={handleDateFilterChange}
        onDateTodayClick={handleDateTodayClick}
        onServiceFilterChange={handleServiceFilterChange}
        onShowArchivedSessions={handleShowArchivedSessions}
        onStatusFilterChange={handleStatusFilterChange}
      />
    </main>
  );
}