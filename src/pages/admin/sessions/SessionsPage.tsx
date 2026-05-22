import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminRefreshableTableArea } from "../../../components/admin/AdminRefreshableTableArea";
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
import { SessionCreateForm } from "./SessionCreateForm";
import { SessionEditForm } from "./SessionEditForm";
import {
  initialCreateForm,
  initialEditForm,
  type SessionForm,
} from "./sessionForm";
import { SessionsFilters } from "./SessionsFilters";
import {
  buildCreateSessionPayload,
  buildEditSessionForm,
  buildUpdateSessionPayload,
  updateSessionFormField,
} from "./sessionsPageHelpers";
import {
  validateCreateSessionPayload,
  validateUpdateSessionPayload,
} from "./sessionsPageValidation";
import { SessionsQuickViewBanner } from "./SessionsQuickViewBanner";
import { SessionsTable } from "./SessionsTable";
import styles from "./SessionsPage.module.css";

function isArchivedStatus(status: SessionStatus | "all") {
  return status === "completed" || status === "cancelled" || status === "no_show";
}

function getParsedClientId(value: string): number | null {
  const clientId = Number(value);

  return Number.isInteger(clientId) && clientId > 0 ? clientId : null;
}

type TimeRangeMinutes = {
  start: number;
  end: number;
};

function parseDateTimeLocalParts(
  value: string
): { dateKey: string; time: string } | null {
  if (!value.includes("T")) {
    return null;
  }

  const dateKey = value.slice(0, 10);
  const time = value.slice(11, 16);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  return { dateKey, time };
}

function getMinutesFromTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.slice(0, 5));

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getWeekdayFromDateKey(dateKey: string): number | null {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const weekday = date.getDay();

  return weekday === 0 ? 7 : weekday;
}

function rangesOverlap(first: TimeRangeMinutes, second: TimeRangeMinutes) {
  return first.start < second.end && second.start < first.end;
}

function getTimeRange(startTime: string, endTime: string): TimeRangeMinutes | null {
  const start = getMinutesFromTime(startTime);
  const end = getMinutesFromTime(endTime);

  if (start === null || end === null || start >= end) {
    return null;
  }

  return { start, end };
}

function getScheduleWorkingRange(
  dateKey: string,
  rules: AdminScheduleRecord["rules"],
  overrides: AdminScheduleRecord["overrides"]
): TimeRangeMinutes | null {
  const override = overrides.find(
    (item) => item.date.slice(0, 10) === dateKey
  );

  if (override) {
    if (!override.isWorkingDay || !override.startTime || !override.endTime) {
      return null;
    }

    return getTimeRange(override.startTime, override.endTime);
  }

  const weekday = getWeekdayFromDateKey(dateKey);

  if (weekday === null) {
    return null;
  }

  const rule = rules.find((item) => item.weekday === weekday);

  if (!rule || !rule.isEnabled) {
    return null;
  }

  return getTimeRange(rule.startTime, rule.endTime);
}

function isNonWorkingDay(
  dateKey: string,
  rules: AdminScheduleRecord["rules"],
  overrides: AdminScheduleRecord["overrides"]
): boolean {
  const override = overrides.find(
    (item) => item.date.slice(0, 10) === dateKey
  );

  if (override) {
    return !override.isWorkingDay || !override.startTime || !override.endTime;
  }

  const weekday = getWeekdayFromDateKey(dateKey);

  if (weekday === null) {
    return false;
  }

  const rule = rules.find((item) => item.weekday === weekday);

  return !rule || !rule.isEnabled;
}

function getManualSessionScheduleWarning(
  form: SessionForm,
  rules: AdminScheduleRecord["rules"],
  overrides: AdminScheduleRecord["overrides"],
  blockedSlots: AdminScheduleRecord["blockedSlots"]
): string | null {
  const dateTimeParts = parseDateTimeLocalParts(form.scheduledAt);

  if (!dateTimeParts) {
    return null;
  }

  const startMinutes = getMinutesFromTime(dateTimeParts.time);
  const durationMinutes = Number(form.durationMinutes);

  if (
    startMinutes === null ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return null;
  }

  const sessionRange = {
    start: startMinutes,
    end: startMinutes + durationMinutes,
  };
  const warnings: string[] = [];

  if (isNonWorkingDay(dateTimeParts.dateKey, rules, overrides)) {
    warnings.push(
      "Вы выбрали день, который сейчас отмечен в расписании как выходной. Сессию всё равно можно создать вручную, если это осознанное исключение."
    );
  } else {
    const workingRange = getScheduleWorkingRange(
      dateTimeParts.dateKey,
      rules,
      overrides
    );

    if (
      workingRange &&
      (sessionRange.start < workingRange.start || sessionRange.end > workingRange.end)
    ) {
      warnings.push(
        "Выбранное время выходит за рабочие часы в расписании. Сессию всё равно можно создать вручную, если это осознанное исключение."
      );
    }
  }

  const blockedSlot = blockedSlots.find((item) => {
    if (item.blockedDate.slice(0, 10) !== dateTimeParts.dateKey) {
      return false;
    }

    const blockedRange = getTimeRange(item.startTime, item.endTime);

    return blockedRange ? rangesOverlap(sessionRange, blockedRange) : false;
  });

  if (blockedSlot) {
    warnings.push(
      blockedSlot.reason
        ? `На это время есть блокировка записи: ${blockedSlot.reason}. Сессию всё равно можно создать вручную, если это осознанное исключение.`
        : "На это время есть блокировка записи. Сессию всё равно можно создать вручную, если это осознанное исключение."
    );
  }

  return warnings.length > 0 ? warnings.join(" ") : null;
}

function filterSessionsByFavoriteClients(
  sessions: CrmSessionRecord[],
  favoriteClientIds: Set<number>,
  favoriteFilter: ClientFavoriteFilter
): CrmSessionRecord[] {
  if (favoriteFilter !== "favorites") {
    return sessions;
  }

  return sessions.filter((session) => favoriteClientIds.has(session.clientId));
}

const createFormPanelId = "session-create-form-panel";

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
    () => filterSessionsByFavoriteClients(items, favoriteClientIds, favoriteFilter),
    [favoriteClientIds, favoriteFilter, items]
  );

  const visibleArchivedItems = useMemo(
    () =>
      filterSessionsByFavoriteClients(
        archivedItems,
        favoriteClientIds,
        favoriteFilter
      ),
    [archivedItems, favoriteClientIds, favoriteFilter]
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

        const archivedSessionsData = await getAdminSessions({
          scope: "archived",
          status: statusFilter,
          clientId: clientFilter,
          serviceId: serviceFilter,
          search: searchQuery,
        });

        if (isMounted) {
          setArchivedItems(archivedSessionsData);
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
        })
        : Promise.resolve(null),
      shouldDisplayArchivedSessions
        ? getAdminSessions({
          scope: "archived",
          status: statusFilter,
          clientId: clientFilter,
          serviceId: serviceFilter,
          search: searchQuery,
        })
        : Promise.resolve(null),
    ]);

    if (sessionsData !== null) {
      setItems(sessionsData);
    }

    if (archivedSessionsData !== null) {
      setArchivedItems(archivedSessionsData);
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
    setHighlightedSessionId(null);
    setShowArchivedSessions(false);
    setArchivedItems([]);
    navigate("/admin/sessions");
  };

  const handleShowArchivedSessions = () => {
    setShowArchivedSessions(true);
  };

  const handleHideArchivedSessions = () => {
    setShowArchivedSessions(false);
    setArchivedItems([]);
  };

  const hasActiveFilters =
    clientFilter !== "all" ||
    favoriteFilter !== "all" ||
    serviceFilter !== "all" ||
    statusFilter !== "all" ||
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

      <div
        className={`${styles.createToggleBar} ${isCreateFormOpen ? styles.createToggleBarOpen : ""
          }`}
      >
        <div className={styles.createToggleText}>
          <h2 className={styles.createToggleTitle}>Создание сессии</h2>
          <p className={styles.createToggleDescription}>
            Форма скрыта по умолчанию, чтобы фильтры и список сессий были ближе к
            началу страницы.
          </p>
        </div>

        <AdminButton
          type="button"
          variant={isCreateFormOpen ? "secondary" : "primary"}
          aria-expanded={isCreateFormOpen}
          aria-controls={createFormPanelId}
          onClick={() => {
            setIsCreateFormOpen((current) => !current);
            resetFeedback();
          }}
        >
          {isCreateFormOpen ? "Скрыть форму" : "Создать сессию вручную"}
        </AdminButton>
      </div>

      <div
        id={createFormPanelId}
        className={`${styles.createPanel} ${isCreateFormOpen ? styles.createPanelOpen : styles.createPanelClosed
          }`}
        aria-hidden={!isCreateFormOpen}
      >
        <div className={styles.createPanelInner}>
          <SessionCreateForm
            clients={clients}
            activeServices={activeServices}
            clientPackages={createClientPackages}
            form={createForm}
            timezone={scheduleTimezone}
            isCreating={isCreating}
            isPackagesLoading={isCreatePackagesLoading}
            onFormChange={handleCreateFormChange}
            onSubmit={handleCreateSession}
          />

          {createScheduleWarning ? (
            <div className={styles.warningFeedback} role="status">
              {createScheduleWarning}
            </div>
          ) : null}
        </div>
      </div>

      {editingSessionId !== null ? (
        <div ref={editFormRef} className={styles.editFormAnchor}>
          <SessionEditForm
            clients={clients}
            activeServices={activeServices}
            clientPackages={editClientPackages}
            form={editForm}
            timezone={scheduleTimezone}
            isUpdating={isUpdating}
            isPackagesLoading={isEditPackagesLoading}
            onFormChange={handleEditFormChange}
            onSubmit={handleUpdateSession}
            onCancel={cancelEditing}
          />
        </div>
      ) : null}

      <SessionsFilters
        clientFilter={clientFilter}
        clients={clients}
        favoriteFilter={favoriteFilter}
        serviceFilter={serviceFilter}
        services={services}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        onClientFilterChange={handleClientFilterChange}
        onFavoriteFilterChange={handleFavoriteFilterChange}
        onServiceFilterChange={handleServiceFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onResetFilters={handleResetView}
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
            onEdit={startEditing}
            onDelete={handleDeleteSession}
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
              Фильтр по клиенту и поиск применяются и к этому списку тоже.
            </p>
          </div>

          {canToggleArchivedSessions ? (
            <AdminButton
              type="button"
              variant="secondary"
              onClick={
                showArchivedSessions
                  ? handleHideArchivedSessions
                  : handleShowArchivedSessions
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
        <AdminRefreshableTableArea isRefreshing={isArchivedSessionsRefreshing}>
          <SessionsTable
            items={displayedArchivedItems}
            isLoading={isArchivedSessionsInitialLoading}
            deletingId={deletingId}
            timezone={scheduleTimezone}
            highlightedSessionId={highlightedSessionId}
            emptyMessage="Завершённых сессий пока нет."
            onEdit={startEditing}
            onDelete={handleDeleteSession}
          />
        </AdminRefreshableTableArea>
      ) : null}
    </main>
  );
}