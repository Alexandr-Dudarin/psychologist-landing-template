import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import { CustomCheckbox } from "../../../components/ui/CustomCheckbox";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
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

function buildServiceOptions(services: CrmServiceRecord[]): CustomSelectOption[] {
  return [
    {
      value: "",
      label: "Выберите базовую услугу",
    },
    ...services.map((service) => ({
      value: String(service.id),
      label: `${service.title} — ${formatAdminPriceInput(service.price)} ₽ / ${
        service.durationMinutes
      } мин${!service.isActive ? " — скрыта" : ""}`,
    })),
  ];
}

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
        <CustomSelect
          value={form.serviceId}
          options={buildServiceOptions(services)}
          onChange={(serviceId) => onChange("serviceId", serviceId)}
          ariaLabel="Базовая услуга для пакета"
          variant="admin"
          layout="form"
          dropdownWidth="trigger"
        />

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

        <CustomCheckbox
          checked={form.isActive}
          onChange={(checked) => onChange("isActive", checked)}
          className={styles.checkboxRow}
          ariaLabel="Пакет активен"
        >
          Пакет активен
        </CustomCheckbox>

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