import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import type { SessionForm } from "./sessionForm";
import {
  getNowDateTimeLocalValue,
  sessionStatusLabels,
} from "./sessionForm";
import styles from "./SessionsPage.module.css";

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
    <AdminSection title="Создать сессию">
      <form onSubmit={onSubmit} className={styles.form}>
        <select
          value={form.clientId}
          onChange={(e) => onFormChange("clientId", e.target.value)}
          className={styles.input}
        >
          <option value="">{"Выберите клиента"}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {"—"} {client.phone || client.email || client.id}
            </option>
          ))}
        </select>

        <select
          value={form.serviceId}
          onChange={(e) => onFormChange("serviceId", e.target.value)}
          className={styles.input}
        >
          <option value="">{"Выберите услугу"}</option>
          {activeServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title} {"—"} {service.price} {"₽"} / {service.durationMinutes} {"мин"}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={form.scheduledAt}
          min={getNowDateTimeLocalValue()}
          onChange={(e) => onFormChange("scheduledAt", e.target.value)}
          className={styles.input}
        />

        <input
          type="number"
          min="1"
          step="1"
          value={form.durationMinutes}
          onChange={(e) => onFormChange("durationMinutes", e.target.value)}
          placeholder="Длительность в минутах"
          className={styles.input}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => onFormChange("price", e.target.value)}
          placeholder="Цена"
          className={styles.input}
        />

        <select
          value={form.status}
          onChange={(e) => onFormChange("status", e.target.value as SessionStatus)}
          className={styles.input}
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
          className={`${styles.input} ${styles.textarea}`}
        />

        <div>
          <AdminButton type="submit" disabled={isCreating} variant="primary">
            {isCreating
              ? "Создание..."
              : "Создать сессию"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}
