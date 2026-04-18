import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { getAdminClients } from "../../../lib/api/adminClients";
import {
  createAdminNote,
  deleteAdminNote,
  getAdminNotes,
  updateAdminNote,
} from "../../../lib/api/adminNotes";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmNoteRecord } from "../../../types/note";
import type { CrmSessionRecord } from "../../../types/session";
import { NoteCreateForm } from "./NoteCreateForm";
import { NoteEditForm } from "./NoteEditForm";
import {
  buildCreateNotePayload,
  buildUpdateNotePayload,
  getEditFormFromNote,
  validateNotePayload,
} from "./noteMutations";
import {
  initialCreateForm,
  initialEditForm,
  type NoteForm,
} from "./noteForm";
import { NotesFilters } from "./NotesFilters";
import {
  getFilterValueFromSearchParam,
  getNextNoteFormState,
  getSessionsForClient,
  hasActiveQuickViewState,
  shouldResetSessionFilter,
  type NotesPageFilterValue,
} from "./notesPageHelpers";
import { NotesQuickViewBanner } from "./NotesQuickViewBanner";
import { NotesTable } from "./NotesTable";

export function NotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmNoteRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [sessions, setSessions] = useState<CrmSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [clientFilter, setClientFilter] =
    useState<NotesPageFilterValue>("all");
  const [sessionFilter, setSessionFilter] =
    useState<NotesPageFilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<NoteForm>(initialCreateForm);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NoteForm>(initialEditForm);

  useEffect(() => {
    setClientFilter(getFilterValueFromSearchParam(searchParams.get("clientId")));
    setSessionFilter(
      getFilterValueFromSearchParam(searchParams.get("sessionId"))
    );
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const [notesData, clientsData, sessionsData] = await Promise.all([
          getAdminNotes({
            clientId: clientFilter,
            sessionId: sessionFilter,
            search: searchQuery,
          }),
          getAdminClients(),
          getAdminSessions(),
        ]);

        if (isMounted) {
          setItems(notesData);
          setClients(clientsData);
          setSessions(sessionsData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить заметки"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [clientFilter, sessionFilter, searchQuery]);

  const availableFilterSessions = useMemo(() => {
    return getSessionsForClient(sessions, clientFilter);
  }, [clientFilter, sessions]);

  useEffect(() => {
    if (
      shouldResetSessionFilter(
        sessionFilter,
        availableFilterSessions,
        isLoading
      )
    ) {
      setSessionFilter("all");
    }
  }, [sessionFilter, availableFilterSessions, isLoading]);

  const availableCreateSessions = useMemo(() => {
    return getSessionsForClient(sessions, createForm.clientId);
  }, [createForm.clientId, sessions]);

  const availableEditSessions = useMemo(() => {
    return getSessionsForClient(sessions, editForm.clientId);
  }, [editForm.clientId, sessions]);

  const resetMessages = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const reloadNotes = async () => {
    const notesData = await getAdminNotes({
      clientId: clientFilter,
      sessionId: sessionFilter,
      search: searchQuery,
    });

    setItems(notesData);
  };

  const handleClientFilterChange = (value: NotesPageFilterValue) => {
    setClientFilter(value);
    setSessionFilter("all");
  };

  const handleSessionFilterChange = (value: NotesPageFilterValue) => {
    setSessionFilter(value);
  };

  const handleCreateFormChange = (field: keyof NoteForm, value: string) => {
    setCreateForm((prev) => getNextNoteFormState(prev, field, value));
    resetMessages();
  };

  const handleEditFormChange = (field: keyof NoteForm, value: string) => {
    setEditForm((prev) => getNextNoteFormState(prev, field, value));
    resetMessages();
  };

  const handleCreateNote = async (event: FormEvent) => {
    event.preventDefault();

    const payload = buildCreateNotePayload(createForm);
    const validationError = validateNotePayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      await createAdminNote(payload);
      await reloadNotes();
      setCreateForm(initialCreateForm);
      setSuccessMessage("Заметка создана.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Не удалось создать заметку"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (note: CrmNoteRecord) => {
    setEditingNoteId(note.id);
    setEditForm(getEditFormFromNote(note));
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditForm(initialEditForm);
  };

  const handleUpdateNote = async (event: FormEvent) => {
    event.preventDefault();

    if (editingNoteId === null) {
      return;
    }

    const payload = buildUpdateNotePayload(editingNoteId, editForm);
    const validationError = validateNotePayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateAdminNote(payload);
      await reloadNotes();
      setSuccessMessage("Заметка обновлена.");
      cancelEditing();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить заметку"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    const confirmed = window.confirm(
      "Удалить заметку? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteAdminNote(id);
      await reloadNotes();

      if (editingNoteId === id) {
        cancelEditing();
      }

      setSuccessMessage("Заметка удалена.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить заметку"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetView = () => {
    setClientFilter("all");
    setSessionFilter("all");
    setSearchQuery("");
    navigate("/admin/notes");
  };

  const hasQuickViewState = hasActiveQuickViewState({
    clientFilter,
    sessionFilter,
    searchQuery,
  });

  return (
    <main>
      <h1>Заметки</h1>

      {hasQuickViewState ? (
        <NotesQuickViewBanner
          clientFilter={clientFilter}
          sessionFilter={sessionFilter}
          searchQuery={searchQuery}
          onReset={handleResetView}
        />
      ) : null}

      <NoteCreateForm
        clients={clients}
        availableSessions={availableCreateSessions}
        form={createForm}
        isCreating={isCreating}
        onChange={handleCreateFormChange}
        onSubmit={handleCreateNote}
      />

      {editingNoteId !== null ? (
        <NoteEditForm
          clients={clients}
          availableSessions={availableEditSessions}
          form={editForm}
          isUpdating={isUpdating}
          onCancel={cancelEditing}
          onChange={handleEditFormChange}
          onSubmit={handleUpdateNote}
        />
      ) : null}

      <NotesFilters
        clientFilter={clientFilter}
        sessionFilter={sessionFilter}
        clients={clients}
        sessions={availableFilterSessions}
        searchQuery={searchQuery}
        onClientFilterChange={handleClientFilterChange}
        onSessionFilterChange={handleSessionFilterChange}
        onSearchChange={setSearchQuery}
      />

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {isLoading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Заметок пока нет.</p>
      ) : (
        <NotesTable
          items={items}
          deletingId={deletingId}
          onEdit={startEditing}
          onDelete={handleDeleteNote}
        />
      )}
    </main>
  );
}
