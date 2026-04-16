import type { FormEvent } from "react";

import { AdminSection } from "../../../components/admin/AdminSection";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmSessionRecord } from "../../../types/session";
import styles from "./NotesPage.module.css";
import { formatSessionLabel, type NoteForm } from "./noteForm";

type NoteEditFormProps = {
  availableSessions: CrmSessionRecord[];
  clients: CrmClientRecord[];
  form: NoteForm;
  isUpdating: boolean;
  onCancel: () => void;
  onChange: (field: keyof NoteForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

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
        <select
          value={form.clientId}
          onChange={(event) => onChange("clientId", event.target.value)}
          className={styles.input}
        >
          <option value="">Выберите клиента</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} — {client.phone || client.email || client.id}
            </option>
          ))}
        </select>

        <select
          value={form.sessionId}
          onChange={(event) => onChange("sessionId", event.target.value)}
          className={styles.input}
          disabled={!form.clientId}
        >
          <option value="">Без привязки к сессии</option>
          {availableSessions.map((session) => (
            <option key={session.id} value={session.id}>
              {formatSessionLabel(session)}
            </option>
          ))}
        </select>

        <textarea
          value={form.content}
          onChange={(event) => onChange("content", event.target.value)}
          placeholder="Текст заметки"
          className={`${styles.input} ${styles.textarea}`}
        />

        <div className={styles.buttonRow}>
          <button type="submit" disabled={isUpdating} className={styles.button}>
            {isUpdating ? "Сохранение..." : "Сохранить изменения"}
          </button>

          <button type="button" onClick={onCancel} className={styles.button}>
            Отменить
          </button>
        </div>
      </form>
    </AdminSection>
  );
}
