import type { CrmSessionRecord } from "../../../types/session";
import type { NoteForm } from "./noteForm";

export type NotesPageFilterValue = number | "all";

type QuickViewState = {
  clientFilter: NotesPageFilterValue;
  sessionFilter: NotesPageFilterValue;
  searchQuery: string;
};

export function getFilterValueFromSearchParam(
  value: string | null
): NotesPageFilterValue {
  if (value === null) {
    return "all";
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : "all";
}

export function getSessionsForClient(
  sessions: CrmSessionRecord[],
  clientId: NotesPageFilterValue | string
) {
  if (clientId === "all") {
    return sessions;
  }

  if (!clientId) {
    return [];
  }

  return sessions.filter(
    (session) => Number(session.clientId) === Number(clientId)
  );
}

export function shouldResetSessionFilter(
  sessionFilter: NotesPageFilterValue,
  availableSessions: CrmSessionRecord[],
  isLoading: boolean
) {
  if (sessionFilter === "all" || isLoading || availableSessions.length === 0) {
    return false;
  }

  return !availableSessions.some(
    (session) => Number(session.id) === Number(sessionFilter)
  );
}

export function getNextNoteFormState(
  form: NoteForm,
  field: keyof NoteForm,
  value: string
): NoteForm {
  if (field === "clientId") {
    return {
      ...form,
      clientId: value,
      sessionId: "",
    };
  }

  return {
    ...form,
    [field]: value,
  };
}

export function hasActiveQuickViewState({
  clientFilter,
  sessionFilter,
  searchQuery,
}: QuickViewState) {
  return (
    clientFilter !== "all" ||
    sessionFilter !== "all" ||
    searchQuery.trim().length > 0
  );
}
