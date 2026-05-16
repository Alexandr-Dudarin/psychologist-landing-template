import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import type { CrmServiceRecord } from "../../../types/service";
import styles from "./ServicesPage.module.css";
import type { ServicePackagePlanForm } from "./servicePackagePlanForm";

type ServicePackagePlanCreateFormProps = {
  form: ServicePackagePlanForm;
  isCreating: boolean;
  services: CrmServiceRecord[];
  onChange: (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ServicePackagePlanCreateForm({
  form,
  isCreating,
  services,
  onChange,
  onSubmit,
}: ServicePackagePlanCreateFormProps) {
  return (
    <AdminSection title="Создать пакет услуг">
      <p className={styles.sectionHint}>
        Пакет привязывается к базовой услуге. Например: пакет из 4 разовых
        сессий использует длительность разовой сессии, но имеет отдельную цену.
      </p>

      <form onSubmit={onSubmit} className={styles.form}>
        <select
          value={form.serviceId}
          onChange={(event) => onChange("serviceId", event.target.value)}
          className={styles.input}
          disabled={services.length === 0}
        >
          <option value="">
            {services.length > 0
              ? "Выберите базовую услугу"
              : "Сначала создайте активную услугу"}
          </option>

          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title} — {service.price} ₽ /{" "}
              {service.durationMinutes} мин
            </option>
          ))}
        </select>

        <input
          type="text"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Название пакета, например: Пакет из 4 разовых сессий"
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
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(event) => onChange("price", event.target.value)}
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

        <div>
          <AdminButton type="submit" disabled={isCreating} variant="primary">
            {isCreating ? "Создание..." : "Создать пакет"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}