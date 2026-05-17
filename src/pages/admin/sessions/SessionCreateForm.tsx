import { useMemo, useState, type FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import { getTimezoneLabel } from "../../../lib/booking/getTimezoneLabel";
import {
  formatAdminPriceInput,
  normalizeAdminPriceInput,
} from "../../../lib/format/adminPriceInput";
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

type SessionCreateFormProps = {
  clients: CrmClientRecord[];
  activeServices: CrmServiceRecord[];
  clientPackages: CrmClientServicePackageRecord[];
  form: SessionForm;
  timezone: string;
  isCreating: boolean;
  isPackagesLoading: boolean;
  onFormChange: (field: keyof SessionForm, value: string) => void;
  onSubmit: (e: FormEvent) => void;
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

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function doesClientMatchSearch(client: CrmClientRecord, query: string): boolean {
  if (!query) {
    return true;
  }

  return [client.name, client.phone, client.email]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
}

export function SessionCreateForm({
  clients,
  activeServices,
  clientPackages,
  form,
  timezone,
  isCreating,
  isPackagesLoading,
  onFormChange,
  onSubmit,
}: SessionCreateFormProps) {
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showFavoriteClientsOnly, setShowFavoriteClientsOnly] = useState(false);

  const timezoneLabel = getTimezoneLabel(timezone, "ru");
  const hasClient = Boolean(form.clientId);
  const hasClientPackage = Boolean(form.clientPackageId);
  const packageOptions = getAvailablePackageOptions(
    clientPackages,
    form.clientPackageId
  );

  const activeClients = useMemo(
    () => clients.filter((client) => client.status === "active"),
    [clients]
  );

  const filteredClients = useMemo(() => {
    const query = normalizeSearchValue(clientSearchQuery);

    const filtered = activeClients.filter((client) => {
      if (showFavoriteClientsOnly && !client.isFavorite) {
        return false;
      }

      return doesClientMatchSearch(client, query);
    });

    const selectedClient = activeClients.find(
      (client) => String(client.id) === form.clientId
    );

    if (
      selectedClient &&
      !filtered.some((client) => client.id === selectedClient.id)
    ) {
      return [selectedClient, ...filtered];
    }

    return filtered;
  }, [activeClients, clientSearchQuery, form.clientId, showFavoriteClientsOnly]);

  const hasActiveClients = activeClients.length > 0;
  const hasFilteredClients = filteredClients.length > 0;

  return (
    <AdminSection title="Создать сессию">
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.clientPicker}>
          <div className={styles.clientPickerTools}>
            <input
              type="text"
              value={clientSearchQuery}
              onChange={(event) => setClientSearchQuery(event.target.value)}
              placeholder="Поиск клиента по имени, телефону или email"
              className={`${styles.input} ${styles.clientSearchInput}`}
            />

            <label className={styles.clientFavoriteToggle}>
              <input
                type="checkbox"
                checked={showFavoriteClientsOnly}
                onChange={(event) =>
                  setShowFavoriteClientsOnly(event.target.checked)
                }
              />
              <span>Только избранные</span>
            </label>
          </div>

          <select
            value={form.clientId}
            onChange={(e) => onFormChange("clientId", e.target.value)}
            className={styles.input}
            disabled={!hasActiveClients}
          >
            <option value="">
              {hasActiveClients ? "Выберите клиента" : "Нет активных клиентов"}
            </option>

            {filteredClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} — {client.phone || client.email || client.id}
              </option>
            ))}
          </select>

          <span className={styles.clientPickerHint}>
            {!hasActiveClients
              ? "В списке показываются только активные клиенты. Сейчас активных клиентов нет."
              : !hasFilteredClients
                ? "По выбранным условиям клиентов не найдено."
                : "В списке показываются только активные клиенты. Можно быстро найти клиента по имени, телефону или email."}
          </span>
        </div>

        <select
          value={form.serviceId}
          onChange={(e) => onFormChange("serviceId", e.target.value)}
          className={styles.input}
        >
          <option value="">Выберите услугу</option>
          {activeServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title} — {formatAdminPriceInput(service.price)} ₽ /{" "}
              {service.durationMinutes} мин
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
              {hasClient ? "Без пакета" : "Сначала выберите клиента"}
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
                ? "При выборе пакета услуга и длительность подтягиваются автоматически. Цена записи из пакета — 0 ₽. Длительность можно изменить вручную."
                : hasClient && packageOptions.length === 0
                  ? "У выбранного клиента нет активных пакетов с остатком сессий."
                  : "Можно оставить пустым, если это обычная разовая запись."}
          </span>
        </label>

        <SessionDateTimeField
          value={form.scheduledAt}
          timezone={timezone}
          onChange={(value) => onFormChange("scheduledAt", value)}
          disablePast
          hint={`Время выбирается в часовом поясе практики: ${timezoneLabel}.`}
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
          type="text"
          inputMode="numeric"
          value={formatAdminPriceInput(form.price)}
          onChange={(e) =>
            onFormChange("price", normalizeAdminPriceInput(e.target.value))
          }
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

        <div>
          <AdminButton type="submit" disabled={isCreating} variant="primary">
            {isCreating ? "Создание..." : "Создать сессию"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}