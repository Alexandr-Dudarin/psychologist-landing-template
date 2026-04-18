import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import type { ClientStatus } from "../../../types/client";
import styles from "./ClientsPage.module.css";
import type { ClientForm } from "./clientForm";

type ClientEditFormProps = {
  form: ClientForm;
  isUpdating: boolean;
  onChange: (field: keyof ClientForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  statusOptions: Array<{ value: ClientStatus; label: string }>;
};

export function ClientEditForm({
  form,
  isUpdating,
  onChange,
  onSubmit,
  onCancel,
  statusOptions,
}: ClientEditFormProps) {
  return (
    <AdminSection title="\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435\u0020\u043a\u043b\u0438\u0435\u043d\u0442\u0430">
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          type="text"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="\u0418\u043c\u044f\u0020\u043a\u043b\u0438\u0435\u043d\u0442\u0430"
          className={styles.input}
        />

        <input
          type="text"
          value={form.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="\u0422\u0435\u043b\u0435\u0444\u043e\u043d"
          className={styles.input}
        />

        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="Email"
          className={styles.input}
        />

        <input
          type="text"
          value={form.source}
          onChange={(event) => onChange("source", event.target.value)}
          placeholder="\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a"
          className={styles.input}
        />

        <select
          value={form.status}
          onChange={(event) => onChange("status", event.target.value)}
          className={styles.select}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className={styles.buttonRow}>
          <AdminButton type="submit" disabled={isUpdating} variant="primary">
            {isUpdating
              ? "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435\u002e\u002e\u002e"
              : "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c\u0020\u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f"}
          </AdminButton>

          <AdminButton
            type="button"
            onClick={onCancel}
            disabled={isUpdating}
            variant="secondary"
          >
            {"\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}
