import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import styles from "./ServicesPage.module.css";
import type { ServiceForm } from "./serviceForm";

type ServiceEditFormProps = {
  form: ServiceForm;
  isUpdating: boolean;
  onCancel: () => void;
  onChange: (field: keyof ServiceForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ServiceEditForm({
  form,
  isUpdating,
  onCancel,
  onChange,
  onSubmit,
}: ServiceEditFormProps) {
  return (
    <AdminSection title="Редактировать услугу">
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
          <span>{"Услуга активна"}</span>
        </label>

        <div className={styles.buttonRow}>
          <AdminButton type="submit" disabled={isUpdating} variant="primary">
            {isUpdating
              ? "Сохранение..."
              : "Сохранить изменения"}
          </AdminButton>

          <AdminButton type="button" onClick={onCancel} variant="secondary">
            {"Отменить"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}
