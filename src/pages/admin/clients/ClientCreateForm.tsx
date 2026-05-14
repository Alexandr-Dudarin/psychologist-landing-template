import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import {
  preferredContactMethodLabels,
  preferredContactPlaceholders,
} from "../../../lib/preferredContact";
import { preferredContactMethods } from "../../../types/preferredContact";
import styles from "./ClientsPage.module.css";
import {
  CLIENT_NAME_PART_MAX_LENGTH,
  sanitizeClientNamePartInput,
  type ClientForm,
} from "./clientForm";

type ClientCreateFormProps = {
  form: ClientForm;
  lastName: string;
  isCreating: boolean;
  showPreferredContact: boolean;
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
  showPreferredContact,
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
          maxLength={CLIENT_NAME_PART_MAX_LENGTH}
          onChange={(event) =>
            onChange("name", sanitizeClientNamePartInput(event.target.value))
          }
          placeholder={namePlaceholder}
          className={styles.input}
        />

        <input
          type="text"
          value={lastName}
          maxLength={CLIENT_NAME_PART_MAX_LENGTH}
          onChange={(event) =>
            onLastNameChange(
              sanitizeClientNamePartInput(event.target.value, {
                allowSpaces: true,
              })
            )
          }
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

        {showPreferredContact ? (
          <>
            <label className={styles.field}>
              <span>Предпочтительный способ связи</span>
              <select
                value={form.preferredContactMethod}
                onChange={(event) =>
                  onChange("preferredContactMethod", event.target.value)
                }
                className={styles.formSelect}
              >
                <option value="">Не указано</option>
                {preferredContactMethods.map((method) => (
                  <option key={method} value={method}>
                    {preferredContactMethodLabels[method]}
                  </option>
                ))}
              </select>
            </label>

            {form.preferredContactMethod ? (
              <input
                type={
                  form.preferredContactMethod === "email" ? "email" : "text"
                }
                value={form.preferredContactValue}
                onChange={(event) =>
                  onChange("preferredContactValue", event.target.value)
                }
                placeholder={
                  preferredContactPlaceholders[form.preferredContactMethod]
                }
                className={styles.input}
              />
            ) : null}
          </>
        ) : null}

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