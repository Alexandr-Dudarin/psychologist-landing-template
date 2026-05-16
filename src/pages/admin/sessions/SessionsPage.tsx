import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

export function SessionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmSessionRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [services, setServices] = useState<CrmServiceRecord[]>([]);
  const [scheduleTimezone, setScheduleTimezone] = useState(
    getDefaultBookingTimezone()
  );
  const [isLoading, setIsLoading] = useState(true);
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
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const [sessionsData, clientsData, servicesData, scheduleData] =
          await Promise.all([
            getAdminSessions({
              status: statusFilter,
              clientId: clientFilter,
              search: searchQuery,
            }),
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
  }, [statusFilter, clientFilter, searchQuery]);

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
    const sessionsData = await getAdminSessions({
      status: statusFilter,
      clientId: clientFilter,
      search: searchQuery,
    });

    setItems(sessionsData);
  };

  const resetFeedback = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleCreateFormChange = (
    field: keyof SessionForm,
    value: string
  ) => {
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
    navigate("/admin/sessions");
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
        <div ref={editFormRef} style={{ scrollMarginTop: 16 }}>
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

      <SessionsTable
        items={items}
        isLoading={isLoading}
        deletingId={deletingId}
        timezone={scheduleTimezone}
        highlightedSessionId={highlightedSessionId}
        onEdit={startEditing}
        onDelete={handleDeleteSession}
      />
    </main>
  );
}