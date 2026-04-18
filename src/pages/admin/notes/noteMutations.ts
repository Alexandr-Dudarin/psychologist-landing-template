import type {
  CreateNotePayload,
  CrmNoteRecord,
  UpdateNotePayload,
} from "../../../types/note";
import type { NoteForm } from "./noteForm";

const NOTE_CLIENT_REQUIRED_ERROR = "Выберите клиента.";
const NOTE_CONTENT_REQUIRED_ERROR = "Текст заметки обязателен.";

export function buildCreateNotePayload(form: NoteForm): CreateNotePayload {
  return {
    clientId: Number(form.clientId),
    sessionId: form.sessionId ? Number(form.sessionId) : null,
    content: form.content.trim(),
  };
}

export function buildUpdateNotePayload(
  id: number,
  form: NoteForm
): UpdateNotePayload {
  return {
    id,
    clientId: Number(form.clientId),
    sessionId: form.sessionId ? Number(form.sessionId) : null,
    content: form.content.trim(),
  };
}

export function validateNotePayload(
  payload: Pick<CreateNotePayload, "clientId" | "content">
): string | null {
  if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
    return NOTE_CLIENT_REQUIRED_ERROR;
  }

  if (!payload.content) {
    return NOTE_CONTENT_REQUIRED_ERROR;
  }

  return null;
}

export function getEditFormFromNote(note: CrmNoteRecord): NoteForm {
  return {
    clientId: String(note.clientId),
    sessionId: note.sessionId ? String(note.sessionId) : "",
    content: note.content,
  };
}
