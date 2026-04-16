import type { FormEvent } from "react";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import type { SessionForm } from "./sessionForm";
import {
  getNowDateTimeLocalValue,
  sessionStatusLabels,
} from "./sessionForm";

type SessionCreateFormProps = {
  clients: CrmClientRecord[];
  activeServices: CrmServiceRecord[];
  form: SessionForm;
  isCreating: boolean;
  onFormChange: (field: keyof SessionForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function SessionCreateForm({
  clients,
  activeServices,
  form,
  isCreating,
  onFormChange,
  onSubmit,
}: SessionCreateFormProps) {
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
      <h2 style={{ marginTop: 0 }}>Создать сессию</h2>

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
          min={getNowDateTimeLocalValue()}
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

        <div>
          <button type="submit" disabled={isCreating} style={buttonStyle}>
            {isCreating ? "Создание..." : "Создать сессию"}
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