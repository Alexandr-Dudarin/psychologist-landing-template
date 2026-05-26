import type {
  ClientFavoriteFilter,
  CrmClientRecord,
} from "../../../types/client";
import type { CrmNoteRecord } from "../../../types/note";
import type { CrmSessionRecord } from "../../../types/session";
import type { NoteForm } from "./noteForm";

export type NotesPageFilterValue = number | "all";

export type NotesPageFilters = {
  clientFilter: NotesPageFilterValue;
  favoriteFilter: ClientFavoriteFilter;
  searchQuery: string;
  sessionFilter?: NotesPageFilterValue;
};

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

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function doesNoteMatchSearch(
  note: CrmNoteRecord,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  return [note.content, note.clientName, note.sessionServiceTitle]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function getNotesFilteredByFavoriteClients(
  notes: CrmNoteRecord[],
  clients: CrmClientRecord[],
  favoriteFilter: ClientFavoriteFilter
): CrmNoteRecord[] {
  if (favoriteFilter !== "favorites") {
    return notes;
  }

  const favoriteClientIds = new Set(
    clients.filter((client) => client.isFavorite).map((client) => client.id)
  );

  return notes.filter((note) => favoriteClientIds.has(note.clientId));
}

export function filterNotes(
  notes: CrmNoteRecord[],
  clients: CrmClientRecord[],
  {
    clientFilter,
    favoriteFilter,
    searchQuery,
    sessionFilter = "all",
  }: NotesPageFilters
): CrmNoteRecord[] {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  return getNotesFilteredByFavoriteClients(
    notes,
    clients,
    favoriteFilter
  ).filter((note) => {
    if (clientFilter !== "all" && note.clientId !== clientFilter) {
      return false;
    }

    if (sessionFilter !== "all" && note.sessionId !== sessionFilter) {
      return false;
    }

    return doesNoteMatchSearch(note, normalizedQuery);
  });
}
