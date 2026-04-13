import { useEffect, useMemo, useState } from "react";
import { getAdminClients } from "../../../lib/api/adminClients";
import { getAdminServices } from "../../../lib/api/adminServices";
import {
  getAdminSessions,
  createAdminSession,
} from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionStatus,
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

const initialForm: SessionForm = {
  clientId: "",
  serviceId: "",
  scheduledAt: "",
  durationMinutes: "60",
  price: "0",
  status: "scheduled",
  notes: "",
};

export function SessionsPage() {
  const [items, setItems] = useState<CrmSessionRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [services, setServices] = useState<CrmServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<SessionForm>(initialForm);

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

  const handleFormChange = (
    field: keyof SessionForm,
    value: string
  ) => {
    if (field === "serviceId") {
      const selectedService = services.find(
        (service) => service.id === Number(value)
      );

      setForm((prev) => ({
        ...prev,
        serviceId: value,
        durationMinutes: selectedService
          ? String(selectedService.durationMinutes)
          : prev.durationMinutes,
        price: selectedService ? String(selectedService.price) : prev.price,
      }));
    } else {
      setForm((prev) => ({
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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateSessionPayload = {
      clientId: Number(form.clientId),
      serviceId: Number(form.serviceId),
      scheduledAt: form.scheduledAt,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
      status: form.status,
      notes: form.notes.trim(),
      source: "manual",
    };

    if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
      setError("Выберите клиента.");
      return;
    }

    if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
      setError("Выберите услугу.");
      return;
    }

    if (!payload.scheduledAt) {
      setError("Укажите дату и время сессии.");
      return;
    }

    if (
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0
    ) {
      setError("Укажите корректную длительность.");
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setError("Укажите корректную цену.");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      await createAdminSession(payload);
      await reloadSessions();
      setForm(initialForm);
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
            value={form.clientId}
            onChange={(e) => handleFormChange("clientId", e.target.value)}
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
            value={form.serviceId}
            onChange={(e) => handleFormChange("serviceId", e.target.value)}
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
            value={form.scheduledAt}
            onChange={(e) => handleFormChange("scheduledAt", e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            min="1"
            step="1"
            value={form.durationMinutes}
            onChange={(e) =>
              handleFormChange("durationMinutes", e.target.value)
            }
            placeholder="Длительность в минутах"
            style={inputStyle}
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => handleFormChange("price", e.target.value)}
            placeholder="Цена"
            style={inputStyle}
          />

          <select
            value={form.status}
            onChange={(e) =>
              handleFormChange("status", e.target.value as SessionStatus)
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
            value={form.notes}
            onChange={(e) => handleFormChange("notes", e.target.value)}
            placeholder="Заметка"
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
          />

          <div>
            <button
              type="submit"
              disabled={isCreating}
              style={buttonStyle}
            >
              {isCreating ? "Создание..." : "Создать сессию"}
            </button>
          </div>
        </form>
      </section>

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