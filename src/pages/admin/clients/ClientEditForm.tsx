import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import type { ClientStatus } from "../../../types/client";
import {
  preferredContactMethodLabels,
  preferredContactPlaceholders,
} from "../../../lib/preferredContact";
import { preferredContactMethods } from "../../../types/preferredContact";
import styles from "./ClientsPage.module.css";
import {
  buildClientName,
  CLIENT_NAME_PART_MAX_LENGTH,
  sanitizeClientNamePartInput,
  splitClientName,
  type ClientForm,
} from "./clientForm";

type ClientEditFormProps = {
  form: ClientForm;
  isUpdating: boolean;
  showPreferredContact: boolean;
  onChange: (field: keyof ClientForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  statusOptions: Array<{ value: ClientStatus; label: string }>;
};

export function ClientEditForm({
  form,
  isUpdating,
  showPreferredContact,
  onChange,
  onSubmit,
  onCancel,
  statusOptions,
}: ClientEditFormProps) {
  const { firstName, lastName } = splitClientName(form.name);

  return (
    <AdminSection title="Редактирование клиента">
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          type="text"
          value={firstName}
          maxLength={CLIENT_NAME_PART_MAX_LENGTH}
          onChange={(event) =>
            onChange(
              "name",
              buildClientName(
                sanitizeClientNamePartInput(event.target.value),
                lastName
              )
            )
          }
          placeholder="Имя"
          className={styles.input}
        />

        <input
          type="text"
          value={lastName}
          maxLength={CLIENT_NAME_PART_MAX_LENGTH}
          onChange={(event) =>
            onChange(
              "name",
              buildClientName(
                firstName,
                sanitizeClientNamePartInput(event.target.value, {
                  allowSpaces: true,
                })
              )
            )
          }
          placeholder="Фамилия"
          className={styles.input}
        />

        <input
          type="text"
          value={form.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="Телефон"
          className={styles.input}
        />

        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="Email"
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
          placeholder="Источник"
          className={styles.input}
        />

        <label className={styles.field}>
          <span>Статус клиента</span>
          <select
            value={form.status}
            onChange={(event) => onChange("status", event.target.value)}
            className={styles.formSelect}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={styles.statusHelpText}>
            Неактивный клиент остаётся в CRM и истории записей, но помещается вниз списка клиентов 
            и визуально отделяется от активных клиентов.
          </span>
        </label>

        <div className={styles.buttonRow}>
          <AdminButton type="submit" disabled={isUpdating} variant="primary">
            {isUpdating ? "Сохранение..." : "Сохранить изменения"}
          </AdminButton>

          <AdminButton
            type="button"
            onClick={onCancel}
            disabled={isUpdating}
            variant="secondary"
          >
            Отменить
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}