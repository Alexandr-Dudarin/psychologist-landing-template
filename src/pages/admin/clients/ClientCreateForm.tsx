import type { FormEvent } from "react";

import styles from "./ClientsPage.module.css";
import type { ManualClientForm } from "./clientForm";

type ClientCreateFormProps = {
  form: ManualClientForm;
  isCreating: boolean;
  onChange: (field: keyof ManualClientForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  namePlaceholder: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  sourcePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
};

export function ClientCreateForm({
  form,
  isCreating,
  onChange,
  onSubmit,
  title,
  namePlaceholder,
  phonePlaceholder,
  emailPlaceholder,
  sourcePlaceholder,
  submitLabel,
  submittingLabel,
}: ClientCreateFormProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <form onSubmit={onSubmit} className={styles.form}>
        <input
          type="text"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder={namePlaceholder}
          className={styles.input}
        />

        <input
          type="text"
          value={form.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder={phonePlaceholder}
          className={styles.input}
        />

        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder={emailPlaceholder}
          className={styles.input}
        />

        <input
          type="text"
          value={form.source}
          onChange={(event) => onChange("source", event.target.value)}
          placeholder={sourcePlaceholder}
          className={styles.input}
        />

        <div>
          <button type="submit" disabled={isCreating} className={styles.button}>
            {isCreating ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
