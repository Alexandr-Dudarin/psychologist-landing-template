import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmSessionRecord } from "../../../types/session";
import { formatSessionLabel, type NoteForm } from "./noteForm";
import styles from "./NotesPage.module.css";

type NoteEditFormProps = {
  availableSessions: CrmSessionRecord[];
  clients: CrmClientRecord[];
  form: NoteForm;
  isUpdating: boolean;
  onCancel: () => void;
  onChange: (field: keyof NoteForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function buildClientOptions(clients: CrmClientRecord[]): CustomSelectOption[] {
  return [
    {
      value: "",
      label: "Выберите клиента",
    },
    ...clients.map((client) => ({
      value: String(client.id),
      label: `${client.name} - ${
        client.phone || client.email || "контакты не указаны"
      }`,
    })),
  ];
}

function buildSessionOptions(
  availableSessions: CrmSessionRecord[]
): CustomSelectOption[] {
  return [
    {
      value: "",
      label: "Без привязки к сессии",
    },
    ...availableSessions.map((session) => ({
      value: String(session.id),
      label: formatSessionLabel(session),
    })),
  ];
}

export function NoteEditForm({
  availableSessions,
  clients,
  form,
  isUpdating,
  onCancel,
  onChange,
  onSubmit,
}: NoteEditFormProps) {
  return (
    <AdminSection title="Редактировать заметку">
      <form onSubmit={onSubmit} className={styles.form}>
        <CustomSelect
          value={form.clientId}
          options={buildClientOptions(clients)}
          onChange={(nextClientId) => onChange("clientId", nextClientId)}
          ariaLabel="Выберите клиента для заметки"
          variant="admin"
          layout="form"
          dropdownWidth="trigger"
        />

        <CustomSelect
          value={form.sessionId}
          options={buildSessionOptions(availableSessions)}
          onChange={(nextSessionId) => onChange("sessionId", nextSessionId)}
          ariaLabel="Выберите сессию для заметки"
          disabled={!form.clientId}
          variant="admin"
          layout="form"
          dropdownWidth="trigger"
        />

        <textarea
          value={form.content}
          onChange={(event) => onChange("content", event.target.value)}
          placeholder="Текст заметки"
          className={`${styles.input} ${styles.textarea}`}
        />

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