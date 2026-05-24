import type { FormEvent } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmSessionRecord } from "../../../types/session";
import { NoteClientCombobox } from "./NoteClientCombobox";
import { formatSessionLabel, type NoteForm } from "./noteForm";
import styles from "./NotesPage.module.css";

type NoteCreateFormProps = {
  availableSessions: CrmSessionRecord[];
  clients: CrmClientRecord[];
  form: NoteForm;
  isCreating: boolean;
  onChange: (field: keyof NoteForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

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

export function NoteCreateForm({
  availableSessions,
  clients,
  form,
  isCreating,
  onChange,
  onSubmit,
}: NoteCreateFormProps) {
  return (
    <AdminSection title="Создать заметку">
      <form onSubmit={onSubmit} className={styles.form}>
        <NoteClientCombobox
          clients={clients}
          selectedClientId={form.clientId}
          onClientChange={(clientId) => onChange("clientId", clientId)}
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

        <div>
          <AdminButton type="submit" disabled={isCreating} variant="primary">
            {isCreating ? "Создание..." : "Создать заметку"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}