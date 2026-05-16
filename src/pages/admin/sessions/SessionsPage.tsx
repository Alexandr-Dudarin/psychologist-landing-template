import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import {
  getDefaultBookingTimezone,
  resolveBookingTimezone,
} from "../../../lib/booking/bookingTimezones";
import { getAdminSchedule } from "../../../lib/api/adminSchedule";
import { getAdminClients } from "../../../lib/api/adminClients";
import { getAdminServices } from "../../../lib/api/adminServices";
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSessions,
  updateAdminSession,
} from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { CrmSessionRecord, SessionStatus } from "../../../types/session";
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

export function SessionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmSessionRecord[]>([]);
  const [archivedItems, setArchivedItems] = useState<CrmSessionRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [services, setServices] = useState<CrmServiceRecord[]>([]);
  const [scheduleTimezone, setScheduleTimezone] = useState(
    getDefaultBookingTimezone()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isArchivedLoading, setIsArchivedLoading] = useState(false);
  const [showArchivedSessions, setShowArchivedSessions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState<number | "all">("all");
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

  const isArchivedFilterActive = isArchivedStatus(statusFilter);
  const shouldLoadActiveSessions =
    statusFilter === "all" || statusFilter === "scheduled";
  const shouldShowArchivedPanel =
    statusFilter === "all" || isArchivedFilterActive;
  const canToggleArchivedSessions = statusFilter === "all";

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

        const activeSessionsPromise = shouldLoadActiveSessions
          ? getAdminSessions({
              scope: "active",
              status: statusFilter,
              clientId: clientFilter,
              search: searchQuery,
            })
          : Promise.resolve([]);

        const [sessionsData, clientsData, servicesData, scheduleData] =
          await Promise.all([
            activeSessionsPromise,
            getAdminClients(),
            getAdminServices(),
            getAdminSchedule(),
          ]);

        if (isMounted) {
          setItems(sessionsData);
          setClients(clientsData);
          setServices(servicesData);
          setScheduleTimezone(
            resolveBookingTimezone(scheduleData.settings.timezone)
          );
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
  }, [statusFilter, clientFilter, searchQuery, shouldLoadActiveSessions]);

  useEffect(() => {
    if (!showArchivedSessions) {
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
          search: searchQuery,
        });

        if (isMounted) {
          setArchivedItems(archivedSessionsData);
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
  }, [showArchivedSessions, statusFilter, clientFilter, searchQuery]);

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
            search: searchQuery,
          })
        : Promise.resolve([]),
      showArchivedSessions
        ? getAdminSessions({
            scope: "archived",
            status: statusFilter,
            clientId: clientFilter,
            search: searchQuery,
          })
        : Promise.resolve(null),
    ]);

    setItems(sessionsData);

    if (archivedSessionsData !== null) {
      setArchivedItems(archivedSessionsData);
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

  const handleCreateFormChange = (field: keyof SessionForm, value: string) => {
    setCreateForm((prev) =>
      updateSessionFormField(prev, field, value, services)
    );
    resetFeedback();
  };

  const handleEditFormChange = (field: keyof SessionForm, value: string) => {
    setEditForm((prev) => updateSessionFormField(prev, field, value, services));
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
      setSuccessMessage("Сессия создана.");
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
      setSuccessMessage("Сессия обновлена.");
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

  const hasQuickViewState =
    clientFilter !== "all" ||
    highlightedSessionId !== null ||
    searchQuery.trim().length > 0;

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

      <SessionCreateForm
        clients={clients}
        activeServices={activeServices}
        form={createForm}
        timezone={scheduleTimezone}
        isCreating={isCreating}
        onFormChange={handleCreateFormChange}
        onSubmit={handleCreateSession}
      />

      {editingSessionId !== null ? (
        <div ref={editFormRef} className={styles.editFormAnchor}>
          <SessionEditForm
            clients={clients}
            activeServices={activeServices}
            form={editForm}
            timezone={scheduleTimezone}
            isUpdating={isUpdating}
            onFormChange={handleEditFormChange}
            onSubmit={handleUpdateSession}
            onCancel={cancelEditing}
          />
        </div>
      ) : null}

      <SessionsFilters
        clientFilter={clientFilter}
        clients={clients}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onClientFilterChange={setClientFilter}
        onStatusFilterChange={setStatusFilter}
        onSearchQueryChange={setSearchQuery}
      />

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {shouldLoadActiveSessions ? (
        <SessionsTable
          items={items}
          isLoading={isLoading}
          deletingId={deletingId}
          timezone={scheduleTimezone}
          highlightedSessionId={highlightedSessionId}
          emptyMessage="Запланированных сессий пока нет."
          onEdit={startEditing}
          onDelete={handleDeleteSession}
        />
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

      {showArchivedSessions ? (
        <SessionsTable
          items={archivedItems}
          isLoading={isArchivedLoading}
          deletingId={deletingId}
          timezone={scheduleTimezone}
          highlightedSessionId={highlightedSessionId}
          emptyMessage="Завершённых сессий пока нет."
          onEdit={startEditing}
          onDelete={handleDeleteSession}
        />
      ) : null}
    </main>
  );
}