import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import { CustomCheckbox } from "../../../components/ui/CustomCheckbox";
import {
  formatAdminPriceInput,
  normalizeAdminPriceInput,
} from "../../../lib/format/adminPriceInput";
import styles from "./ServicesPage.module.css";
import type { ServiceForm } from "./serviceForm";

type ServiceCreateFormProps = {
  form: ServiceForm;
  isCreating: boolean;
  onChange: (field: keyof ServiceForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ServiceCreateForm({
  form,
  isCreating,
  onChange,
  onSubmit,
}: ServiceCreateFormProps) {
  return (
    <AdminSection title="Создать услугу">
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          type="text"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Название услуги"
          className={styles.input}
        />

        <textarea
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Описание услуги"
          className={`${styles.input} ${styles.textarea}`}
        />

        <input
          type="text"
          inputMode="numeric"
          value={formatAdminPriceInput(form.price)}
          onChange={(event) =>
            onChange("price", normalizeAdminPriceInput(event.target.value))
          }
          placeholder="Цена"
          className={styles.input}
        />

        <input
          type="number"
          min="1"
          step="1"
          value={form.durationMinutes}
          onChange={(event) => onChange("durationMinutes", event.target.value)}
          placeholder="Длительность в минутах"
          className={styles.input}
        />

        <CustomCheckbox
          checked={form.isActive}
          onChange={(checked) => onChange("isActive", checked)}
          className={styles.checkboxRow}
          ariaLabel="Услуга активна"
        >
          Услуга активна
        </CustomCheckbox>

        <div>
          <AdminButton type="submit" disabled={isCreating} variant="primary">
            {isCreating ? "Создание..." : "Создать услугу"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}