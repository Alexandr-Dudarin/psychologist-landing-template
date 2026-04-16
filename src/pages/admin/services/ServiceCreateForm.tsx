import type { FormEvent } from "react";

import { AdminSection } from "../../../components/admin/AdminSection";
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
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(event) => onChange("price", event.target.value)}
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

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
          <span>Услуга активна</span>
        </label>

        <div>
          <button type="submit" disabled={isCreating} className={styles.button}>
            {isCreating ? "Создание..." : "Создать услугу"}
          </button>
        </div>
      </form>
    </AdminSection>
  );
}
