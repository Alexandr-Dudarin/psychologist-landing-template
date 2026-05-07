import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import styles from "./ClientsPage.module.css";
import type { ClientForm } from "./clientForm";

type ClientCreateFormProps = {
  form: ClientForm;
  lastName: string;
  isCreating: boolean;
  onChange: (field: keyof ClientForm, value: string) => void;
  onLastNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  namePlaceholder: string;
  lastNamePlaceholder: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  sourcePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
};

export function ClientCreateForm({
  form,
  lastName,
  isCreating,
  onChange,
  onLastNameChange,
  onSubmit,
  title,
  namePlaceholder,
  lastNamePlaceholder,
  phonePlaceholder,
  emailPlaceholder,
  sourcePlaceholder,
  submitLabel,
  submittingLabel,
}: ClientCreateFormProps) {
  return (
    <AdminSection title={title}>
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
          value={lastName}
          onChange={(event) => onLastNameChange(event.target.value)}
          placeholder={lastNamePlaceholder}
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
          <AdminButton type="submit" disabled={isCreating} variant="primary">
            {isCreating ? submittingLabel : submitLabel}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}
