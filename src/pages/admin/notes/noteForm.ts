import type { CrmSessionRecord } from "../../../types/session";

export type NoteForm = {
  clientId: string;
  sessionId: string;
  content: string;
};

export const initialCreateForm: NoteForm = {
  clientId: "",
  sessionId: "",
  content: "",
};

export const initialEditForm: NoteForm = {
  clientId: "",
  sessionId: "",
  content: "",
};

export function formatSessionLabel(session: CrmSessionRecord) {
  return `${new Date(session.scheduledAt).toLocaleString("ru-RU")} — ${session.serviceTitle}`;
}
