import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import { getTimezoneLabel } from "../../../lib/booking/getTimezoneLabel";
import type {
  CrmClientRecord,
  CrmClientServicePackageRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import type { SessionForm } from "./sessionForm";
import { sessionStatusLabels } from "./sessionForm";
import { SessionDateTimeField } from "./SessionDateTimeField";
import styles from "./SessionsPage.module.css";

type SessionEditFormProps = {
  clients: CrmClientRecord[];
  activeServices: CrmServiceRecord[];
  clientPackages: CrmClientServicePackageRecord[];
  form: SessionForm;
  timezone: string;
  isUpdating: boolean;
  isPackagesLoading: boolean;
  onFormChange: (field: keyof SessionForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

function getPackageOptionLabel(item: CrmClientServicePackageRecord): string {
  return `${item.packageTitle} — осталось ${item.remainingSessions} из ${item.totalSessions} — ${item.code}`;
}

function getAvailablePackageOptions(
  items: CrmClientServicePackageRecord[],
  selectedPackageId: string
): CrmClientServicePackageRecord[] {
  return items.filter((item) => {
    const isSelected = String(item.id) === selectedPackageId;

    return isSelected || (item.status === "active" && item.remainingSessions > 0);
  });
}

export function SessionEditForm({
  clients,
  activeServices,
  clientPackages,
  form,
  timezone,
  isUpdating,
  isPackagesLoading,
  onFormChange,
  onSubmit,
  onCancel,
}: SessionEditFormProps) {
  const timezoneLabel = getTimezoneLabel(timezone, "ru");
  const hasClient = Boolean(form.clientId);
  const hasClientPackage = Boolean(form.clientPackageId);
  const packageOptions = getAvailablePackageOptions(
    clientPackages,
    form.clientPackageId
  );

  return (
    <AdminSection title="Редактировать сессию">
      <form onSubmit={onSubmit} className={styles.form}>
        <select
          value={form.clientId}
          onChange={(e) => onFormChange("clientId", e.target.value)}
          className={styles.input}
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
          className={styles.input}
        >
          <option value="">Выберите услугу</option>
          {activeServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title} — {service.price} ₽ / {service.durationMinutes} мин
            </option>
          ))}
        </select>

        <label className={styles.packageField}>
          <span className={styles.packageFieldLabel}>
            Пакет клиента, если запись идёт из пакета
          </span>

          <select
            value={form.clientPackageId}
            onChange={(e) => onFormChange("clientPackageId", e.target.value)}
            className={styles.input}
            disabled={!hasClient || isPackagesLoading}
          >
            <option value="">
              {hasClient
                ? "Без пакета"
                : "Сначала выберите клиента"}
            </option>

            {packageOptions.map((item) => (
              <option
                key={item.id}
                value={item.id}
                disabled={
                  String(item.id) !== form.clientPackageId &&
                  (item.status !== "active" || item.remainingSessions <= 0)
                }
              >
                {getPackageOptionLabel(item)}
              </option>
            ))}
          </select>

          <span className={styles.packageFieldHint}>
            {isPackagesLoading
              ? "Загружаем пакеты клиента..."
              : hasClientPackage
                ? "Эта сессия связана с пакетом. Если сменить услугу, связь с пакетом будет сброшена."
                : hasClient && packageOptions.length === 0
                  ? "У выбранного клиента нет активных пакетов с остатком сессий."
                  : "Можно оставить пустым, если это обычная разовая запись."}
          </span>
        </label>

        <SessionDateTimeField
          value={form.scheduledAt}
          timezone={timezone}
          onChange={(value) => onFormChange("scheduledAt", value)}
          hint={`Время редактируется в часовом поясе практики: ${timezoneLabel}.`}
        />

        <input
          type="number"
          min="1"
          step="1"
          value={form.durationMinutes}
          onChange={(e) => onFormChange("durationMinutes", e.target.value)}
          placeholder="Длительность в минутах"
          className={styles.input}
          disabled={hasClientPackage}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => onFormChange("price", e.target.value)}
          placeholder="Цена"
          className={styles.input}
          disabled={hasClientPackage}
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

        <div className={styles.buttonRow}>
          <AdminButton type="submit" disabled={isUpdating} variant="primary">
            {isUpdating ? "Сохранение..." : "Сохранить изменения"}
          </AdminButton>

          <AdminButton type="button" onClick={onCancel} variant="secondary">
            Отменить
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}