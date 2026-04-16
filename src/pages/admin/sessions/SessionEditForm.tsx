import type { FormEvent } from "react";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import type { SessionForm } from "./sessionForm";
import { sessionStatusLabels } from "./sessionForm";

type SessionEditFormProps = {
  clients: CrmClientRecord[];
  activeServices: CrmServiceRecord[];
  form: SessionForm;
  isUpdating: boolean;
  onFormChange: (field: keyof SessionForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

export function SessionEditForm({
  clients,
  activeServices,
  form,
  isUpdating,
  onFormChange,
  onSubmit,
  onCancel,
}: SessionEditFormProps) {
  return (
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
        onSubmit={onSubmit}
        style={{
          display: "grid",
          gap: "12px",
          maxWidth: "720px",
        }}
      >
        <select
          value={form.clientId}
          onChange={(e) => onFormChange("clientId", e.target.value)}
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
          onChange={(e) => onFormChange("serviceId", e.target.value)}
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
          onChange={(e) => onFormChange("scheduledAt", e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          min="1"
          step="1"
          value={form.durationMinutes}
          onChange={(e) => onFormChange("durationMinutes", e.target.value)}
          placeholder="Длительность в минутах"
          style={inputStyle}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => onFormChange("price", e.target.value)}
          placeholder="Цена"
          style={inputStyle}
        />

        <select
          value={form.status}
          onChange={(e) => onFormChange("status", e.target.value as SessionStatus)}
          style={inputStyle}
        >
          {sessionStatuses.map((status) => (
            <option key={status} value={status}>
              {sessionStatusLabels[status]}
            </option>
          ))}
        </select>

        <textarea
          value={form.notes}
          onChange={(e) => onFormChange("notes", e.target.value)}
          placeholder="Заметка"
          style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button type="submit" disabled={isUpdating} style={buttonStyle}>
            {isUpdating ? "Сохранение..." : "Сохранить изменения"}
          </button>

          <button type="button" onClick={onCancel} style={buttonStyle}>
            Отменить
          </button>
        </div>
      </form>
    </section>
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