import { useEffect, useMemo, useState } from "react";
import { getAdminClients } from "../../../lib/api/adminClients";
import { getAdminServices } from "../../../lib/api/adminServices";
import {
  getAdminSessions,
  createAdminSession,
  updateAdminSession,
} from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionStatus,
  UpdateSessionPayload,
} from "../../../types/session";
import { sessionStatuses } from "../../../types/session";

type SessionForm = {
  clientId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: string;
  price: string;
  status: SessionStatus;
  notes: string;
};

const initialCreateForm: SessionForm = {
  clientId: "",
  serviceId: "",
  scheduledAt: "",
  durationMinutes: "60",
  price: "0",
  status: "scheduled",
  notes: "",
};

const initialEditForm: SessionForm = {
  clientId: "",
  serviceId: "",
  scheduledAt: "",
  durationMinutes: "60",
  price: "0",
  status: "scheduled",
  notes: "",
};

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function SessionsPage() {
  const [items, setItems] = useState<CrmSessionRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [services, setServices] = useState<CrmServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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

  return (
    <main>
      <h1>Сессии</h1>

      <section
        style={{
          marginTop: "20px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Создать сессию</h2>

        <form
          onSubmit={handleCreateSession}
          style={{
            display: "grid",
            gap: "12px",
            maxWidth: "720px",
          }}
        >
          <select
            value={createForm.clientId}
            onChange={(e) => handleCreateFormChange("clientId", e.target.value)}
            style={inputStyle}
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} — {client.phone || client.email || client.id}
              </option>
            ))}
          </select>

          <select
            value={createForm.serviceId}
            onChange={(e) => handleCreateFormChange("serviceId", e.target.value)}
            style={inputStyle}
          >
            <option value="">Выберите услугу</option>
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title} — {service.price} ₽ / {service.durationMinutes} мин
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={createForm.scheduledAt}
            onChange={(e) =>
              handleCreateFormChange("scheduledAt", e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="number"
            min="1"
            step="1"
            value={createForm.durationMinutes}
            onChange={(e) =>
              handleCreateFormChange("durationMinutes", e.target.value)
            }
            placeholder="Длительность в минутах"
            style={inputStyle}
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={createForm.price}
            onChange={(e) => handleCreateFormChange("price", e.target.value)}
            placeholder="Цена"
            style={inputStyle}
          />

          <select
            value={createForm.status}
            onChange={(e) =>
              handleCreateFormChange("status", e.target.value as SessionStatus)
            }
            style={inputStyle}
          >
            {sessionStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <textarea
            value={createForm.notes}
            onChange={(e) => handleCreateFormChange("notes", e.target.value)}
            placeholder="Заметка"
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
          />

          <div>
            <button type="submit" disabled={isCreating} style={buttonStyle}>
              {isCreating ? "Создание..." : "Создать сессию"}
            </button>
          </div>
        </form>
      </section>

      {editingSessionId !== null && (
        <section
          style={{
            marginTop: "20px",
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Редактировать сессию</h2>

          <form
            onSubmit={handleUpdateSession}
            style={{
              display: "grid",
              gap: "12px",
              maxWidth: "720px",
            }}
          >
            <select
              value={editForm.clientId}
              onChange={(e) => handleEditFormChange("clientId", e.target.value)}
              style={inputStyle}
            >
              <option value="">Выберите клиента</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — {client.phone || client.email || client.id}
                </option>
              ))}
            </select>

            <select
              value={editForm.serviceId}
              onChange={(e) => handleEditFormChange("serviceId", e.target.value)}
              style={inputStyle}
            >
              <option value="">Выберите услугу</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title} — {service.price} ₽ / {service.durationMinutes} мин
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={editForm.scheduledAt}
              onChange={(e) =>
                handleEditFormChange("scheduledAt", e.target.value)
              }
              style={inputStyle}
            />

            <input
              type="number"
              min="1"
              step="1"
              value={editForm.durationMinutes}
              onChange={(e) =>
                handleEditFormChange("durationMinutes", e.target.value)
              }
              placeholder="Длительность в минутах"
              style={inputStyle}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.price}
              onChange={(e) => handleEditFormChange("price", e.target.value)}
              placeholder="Цена"
              style={inputStyle}
            />

            <select
              value={editForm.status}
              onChange={(e) =>
                handleEditFormChange("status", e.target.value as SessionStatus)
              }
              style={inputStyle}
            >
              {sessionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <textarea
              value={editForm.notes}
              onChange={(e) => handleEditFormChange("notes", e.target.value)}
              placeholder="Заметка"
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button type="submit" disabled={isUpdating} style={buttonStyle}>
                {isUpdating ? "Сохранение..." : "Сохранить изменения"}
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                style={buttonStyle}
              >
                Отменить
              </button>
            </div>
          </form>
        </section>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "16px",
          marginBottom: "16px",
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as SessionStatus | "all")
          }
          style={{
            minWidth: "180px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        >
          <option value="all">все статусы</option>
          {sessionStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по клиенту, услуге или заметке"
          style={{
            minWidth: "320px",
            maxWidth: "420px",
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {error && <p style={{ color: "#d96b6b" }}>{error}</p>}
      {successMessage && <p style={{ color: "#2e8b57" }}>{successMessage}</p>}

      {isLoading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Сессий пока нет.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr>
                <th style={cellHeadStyle}>ID</th>
                <th style={cellHeadStyle}>Дата</th>
                <th style={cellHeadStyle}>Клиент</th>
                <th style={cellHeadStyle}>Услуга</th>
                <th style={cellHeadStyle}>Цена</th>
                <th style={cellHeadStyle}>Длительность</th>
                <th style={cellHeadStyle}>Статус</th>
                <th style={cellHeadStyle}>Заметка</th>
                <th style={cellHeadStyle}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>
                    {new Date(item.scheduledAt).toLocaleString("ru-RU")}
                  </td>
                  <td style={cellStyle}>{item.clientName}</td>
                  <td style={cellStyle}>{item.serviceTitle}</td>
                  <td style={cellStyle}>{item.price} ₽</td>
                  <td style={cellStyle}>{item.durationMinutes} мин</td>
                  <td style={cellStyle}>{item.status}</td>
                  <td style={cellStyle}>{item.notes || "-"}</td>
                  <td style={cellStyle}>
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      style={buttonStyle}
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
};

const cellHeadStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontWeight: 700,
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};