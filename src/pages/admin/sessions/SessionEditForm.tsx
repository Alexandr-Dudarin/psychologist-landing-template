import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
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

function getClientOptionLabel(client: CrmClientRecord): string {
  const contact = client.phone || client.email;

  return contact
    ? `${client.name} — ${contact}`
    : `${client.name} — контакты не указаны`;
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

  const clientOptions: CustomSelectOption[] = [
    {
      value: "",
      label: "Выберите клиента",
    },
    ...clients.map((client) => ({
      value: String(client.id),
      label: getClientOptionLabel(client),
    })),
  ];

  const serviceOptions: CustomSelectOption[] = [
    {
      value: "",
      label: "Выберите услугу",
    },
    ...activeServices.map((service) => ({
      value: String(service.id),
      label: `${service.title} — ${formatAdminPriceInput(service.price)} ₽ / ${
        service.durationMinutes
      } мин`,
    })),
  ];

  const clientPackageOptions: CustomSelectOption[] = [
    {
      value: "",
      label: hasClient ? "Без пакета" : "Сначала выберите клиента",
    },
    ...packageOptions.map((item) => ({
      value: String(item.id),
      label: getPackageOptionLabel(item),
      disabled:
        String(item.id) !== form.clientPackageId &&
        (item.status !== "active" || item.remainingSessions <= 0),
    })),
  ];

  const statusOptions: CustomSelectOption[] = sessionStatuses.map((status) => ({
    value: status,
    label: sessionStatusLabels[status],
  }));

  return (
    <AdminSection title="Редактировать сессию">
      <form onSubmit={onSubmit} className={styles.form}>
        <CustomSelect
          value={form.clientId}
          options={clientOptions}
          onChange={(value) => onFormChange("clientId", value)}
          ariaLabel="Клиент сессии"
          variant="admin"
          layout="full"
        />

        <CustomSelect
          value={form.serviceId}
          options={serviceOptions}
          onChange={(value) => onFormChange("serviceId", value)}
          ariaLabel="Услуга сессии"
          variant="admin"
          layout="full"
        />

        <label className={styles.packageField}>
          <span className={styles.packageFieldLabel}>
            Пакет клиента, если запись идёт из пакета
          </span>

          <CustomSelect
            value={form.clientPackageId}
            options={clientPackageOptions}
            onChange={(value) => onFormChange("clientPackageId", value)}
            ariaLabel="Пакет клиента для сессии"
            disabled={!hasClient || isPackagesLoading}
            variant="admin"
            layout="full"
          />

          <span className={styles.packageFieldHint}>
            {isPackagesLoading
              ? "Загружаем пакеты клиента..."
              : hasClientPackage
                ? "Эта сессия связана с пакетом. Цена записи из пакета — 0 ₽, а длительность можно изменить вручную. Если сменить услугу, связь с пакетом будет сброшена."
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

        <CustomSelect
          value={form.status}
          options={statusOptions}
          onChange={(value) => onFormChange("status", value as SessionStatus)}
          ariaLabel="Статус сессии"
          variant="admin"
          layout="full"
        />

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