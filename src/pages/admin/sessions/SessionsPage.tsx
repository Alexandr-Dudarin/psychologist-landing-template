import { useEffect, useMemo, useState } from "react";
import { getAdminClients } from "../../../lib/api/adminClients";
import { getAdminServices } from "../../../lib/api/adminServices";
import {
  getAdminSessions,
  createAdminSession,
  updateAdminSession,
  deleteAdminSession,
} from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionStatus,
  UpdateSessionPayload,
} from "../../../types/session";
import { SessionCreateForm } from "./SessionCreateForm";
import { SessionEditForm } from "./SessionEditForm";
import { SessionsFilters } from "./SessionsFilters";
import { SessionsTable } from "./SessionsTable";
import {
  initialCreateForm,
  initialEditForm,
  type SessionForm,
  toDateTimeLocalValue,
} from "./sessionForm";

export function SessionsPage() {
  const [items, setItems] = useState<CrmSessionRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [services, setServices] = useState<CrmServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<SessionForm>(initialCreateForm);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SessionForm>(initialEditForm);

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services]
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const [sessionsData, clientsData, servicesData] = await Promise.all([
          getAdminSessions({
            status: statusFilter,
            search: searchQuery,
          }),
          getAdminClients(),
          getAdminServices(),
        ]);

        if (isMounted) {
          setItems(sessionsData);
          setClients(clientsData);
          setServices(servicesData);
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
  }, [statusFilter, searchQuery]);

  const reloadSessions = async () => {
    const sessionsData = await getAdminSessions({
      status: statusFilter,
      search: searchQuery,
    });

    setItems(sessionsData);
  };

  const applyServiceDefaults = (
    prev: SessionForm,
    serviceIdValue: string
  ): SessionForm => {
    const selectedService = services.find(
      (service) => service.id === Number(serviceIdValue)
    );

    if (!selectedService) {
      return {
        ...prev,
        serviceId: serviceIdValue,
      };
    }

    return {
      ...prev,
      serviceId: serviceIdValue,
      durationMinutes: String(selectedService.durationMinutes),
      price: String(selectedService.price),
    };
  };

  const handleCreateFormChange = (
    field: keyof SessionForm,
    value: string
  ) => {
    if (field === "serviceId") {
      setCreateForm((prev) => applyServiceDefaults(prev, value));
    } else {
      setCreateForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleEditFormChange = (
    field: keyof SessionForm,
    value: string
  ) => {
    if (field === "serviceId") {
      setEditForm((prev) => applyServiceDefaults(prev, value));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateCreatePayload = (
    payload: CreateSessionPayload
  ): string | null => {
    if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
      return "Выберите клиента.";
    }

    if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
      return "Выберите услугу.";
    }

    if (!payload.scheduledAt) {
      return "Укажите дату и время сессии.";
    }

    if (
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0
    ) {
      return "Укажите корректную длительность.";
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return "Укажите корректную цену.";
    }

    return null;
  };

  const validateUpdatePayload = (
    payload: UpdateSessionPayload
  ): string | null => {
    if (!Number.isInteger(payload.id) || payload.id <= 0) {
      return "Некорректная сессия.";
    }

    if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
      return "Выберите клиента.";
    }

    if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
      return "Выберите услугу.";
    }

    if (!payload.scheduledAt) {
      return "Укажите дату и время сессии.";
    }

    if (
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0
    ) {
      return "Укажите корректную длительность.";
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return "Укажите корректную цену.";
    }

    return null;
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateSessionPayload = {
      clientId: Number(createForm.clientId),
      serviceId: Number(createForm.serviceId),
      scheduledAt: createForm.scheduledAt,
      durationMinutes: Number(createForm.durationMinutes),
      price: Number(createForm.price),
      status: createForm.status,
      notes: createForm.notes.trim(),
      source: "manual",
    };

    const validationError = validateCreatePayload(payload);

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
    setEditForm({
      clientId: String(session.clientId),
      serviceId: String(session.serviceId),
      scheduledAt: toDateTimeLocalValue(session.scheduledAt),
      durationMinutes: String(session.durationMinutes),
      price: String(session.price),
      status: session.status,
      notes: session.notes,
    });
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditForm(initialEditForm);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSessionId === null) {
      return;
    }

    const payload: UpdateSessionPayload = {
      id: editingSessionId,
      clientId: Number(editForm.clientId),
      serviceId: Number(editForm.serviceId),
      scheduledAt: editForm.scheduledAt,
      durationMinutes: Number(editForm.durationMinutes),
      price: Number(editForm.price),
      status: editForm.status,
      notes: editForm.notes.trim(),
    };

    const validationError = validateUpdatePayload(payload);

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

  return (
    <main>
      <h1>Сессии</h1>

      <SessionCreateForm
        clients={clients}
        activeServices={activeServices}
        form={createForm}
        isCreating={isCreating}
        onFormChange={handleCreateFormChange}
        onSubmit={handleCreateSession}
      />

      {editingSessionId !== null && (
        <SessionEditForm
          clients={clients}
          activeServices={activeServices}
          form={editForm}
          isUpdating={isUpdating}
          onFormChange={handleEditFormChange}
          onSubmit={handleUpdateSession}
          onCancel={cancelEditing}
        />
      )}

      <SessionsFilters
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusFilterChange={setStatusFilter}
        onSearchQueryChange={setSearchQuery}
      />

      {error && <p style={{ color: "#d96b6b" }}>{error}</p>}
      {successMessage && <p style={{ color: "#2e8b57" }}>{successMessage}</p>}

      <SessionsTable
        items={items}
        isLoading={isLoading}
        deletingId={deletingId}
        onEdit={startEditing}
        onDelete={handleDeleteSession}
      />
    </main>
  );
}
