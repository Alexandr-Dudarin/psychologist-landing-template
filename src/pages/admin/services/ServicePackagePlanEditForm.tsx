import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import {
  formatAdminPriceInput,
  normalizeAdminPriceInput,
} from "../../../lib/format/adminPriceInput";
import type { CrmServiceRecord } from "../../../types/service";
import styles from "./ServicesPage.module.css";
import type { ServicePackagePlanForm } from "./servicePackagePlanForm";

type ServicePackagePlanEditFormProps = {
  form: ServicePackagePlanForm;
  isUpdating: boolean;
  services: CrmServiceRecord[];
  onCancel: () => void;
  onChange: (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ServicePackagePlanEditForm({
  form,
  isUpdating,
  services,
  onCancel,
  onChange,
  onSubmit,
}: ServicePackagePlanEditFormProps) {
  return (
    <AdminSection title="Редактировать пакет услуг">
      <form onSubmit={onSubmit} className={styles.form}>
        <select
          value={form.serviceId}
          onChange={(event) => onChange("serviceId", event.target.value)}
          className={styles.input}
        >
          <option value="">Выберите базовую услугу</option>

          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title} — {formatAdminPriceInput(service.price)} ₽ /{" "}
              {service.durationMinutes} мин
              {!service.isActive ? " — скрыта" : ""}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Название пакета"
          className={styles.input}
        />

        <textarea
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Описание пакета"
          className={`${styles.input} ${styles.textarea}`}
        />

        <input
          type="number"
          min="1"
          step="1"
          value={form.sessionsCount}
          onChange={(event) => onChange("sessionsCount", event.target.value)}
          placeholder="Количество сессий в пакете"
          className={styles.input}
        />

        <input
          type="text"
          inputMode="numeric"
          value={formatAdminPriceInput(form.price)}
          onChange={(event) =>
            onChange("price", normalizeAdminPriceInput(event.target.value))
          }
          placeholder="Цена пакета"
          className={styles.input}
        />

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
          <span>Пакет активен</span>
        </label>

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