import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { getAdminClients } from "../../../lib/api/adminClients";
import {
  createAdminNote,
  deleteAdminNote,
  getAdminNotes,
  updateAdminNote,
} from "../../../lib/api/adminNotes";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type {
  CreateNotePayload,
  CrmNoteRecord,
  UpdateNotePayload,
} from "../../../types/note";
import type { CrmSessionRecord } from "../../../types/session";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { NoteCreateForm } from "./NoteCreateForm";
import { NoteEditForm } from "./NoteEditForm";
import { NotesFilters } from "./NotesFilters";
import { NotesTable } from "./NotesTable";
import {
  initialCreateForm,
  initialEditForm,
  type NoteForm,
} from "./noteForm";

export function NotesPage() {
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
  const [clientFilter, setClientFilter] = useState<number | "all">("all");
  const [sessionFilter, setSessionFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<NoteForm>(initialCreateForm);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NoteForm>(initialEditForm);

  useEffect(() => {
    const clientIdFromUrl = searchParams.get("clientId");
    const sessionIdFromUrl = searchParams.get("sessionId");

    if (clientIdFromUrl !== null) {
      const parsedClientId = Number(clientIdFromUrl);

      setClientFilter(
        Number.isInteger(parsedClientId) && parsedClientId > 0
          ? parsedClientId
          : "all"
      );
    }

    if (sessionIdFromUrl !== null) {
      const parsedSessionId = Number(sessionIdFromUrl);

      setSessionFilter(
        Number.isInteger(parsedSessionId) && parsedSessionId > 0
          ? parsedSessionId
          : "all"
      );
    }
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
    if (clientFilter === "all") {
      return sessions;
    }

    return sessions.filter(
      (session) => Number(session.clientId) === Number(clientFilter)
    );
  }, [clientFilter, sessions]);

  const availableCreateSessions = useMemo(() => {
    if (!createForm.clientId) {
      return [];
    }

    return sessions.filter(
      (session) => Number(session.clientId) === Number(createForm.clientId)
    );
  }, [createForm.clientId, sessions]);

  const availableEditSessions = useMemo(() => {
    if (!editForm.clientId) {
      return [];
    }

    return sessions.filter(
      (session) => Number(session.clientId) === Number(editForm.clientId)
    );
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

  const handleCreateFormChange = (field: keyof NoteForm, value: string) => {
    if (field === "clientId") {
      setCreateForm((prev) => ({
        ...prev,
        clientId: value,
        sessionId: "",
      }));
    } else {
      setCreateForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    resetMessages();
  };

  const handleEditFormChange = (field: keyof NoteForm, value: string) => {
    if (field === "clientId") {
      setEditForm((prev) => ({
        ...prev,
        clientId: value,
        sessionId: "",
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    resetMessages();
  };

  const handleCreateNote = async (event: FormEvent) => {
    event.preventDefault();

    const payload: CreateNotePayload = {
      clientId: Number(createForm.clientId),
      sessionId: createForm.sessionId ? Number(createForm.sessionId) : null,
      content: createForm.content.trim(),
    };

    if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
      setError("Выберите клиента.");
      return;
    }

    if (!payload.content) {
      setError("Текст заметки обязателен.");
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
    setEditForm({
      clientId: String(note.clientId),
      sessionId: note.sessionId ? String(note.sessionId) : "",
      content: note.content,
    });
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

    const payload: UpdateNotePayload = {
      id: editingNoteId,
      clientId: Number(editForm.clientId),
      sessionId: editForm.sessionId ? Number(editForm.sessionId) : null,
      content: editForm.content.trim(),
    };

    if (!Number.isInteger(payload.clientId) || payload.clientId <= 0) {
      setError("Выберите клиента.");
      return;
    }

    if (!payload.content) {
      setError("Текст заметки обязателен.");
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

  return (
    <main>
      <h1>Заметки</h1>

      {clientFilter !== "all" ? (
        <p className="admin-muted-text">
          Открыт быстрый переход к заметкам клиента #{clientFilter}.
        </p>
      ) : null}

      {sessionFilter !== "all" ? (
        <p className="admin-muted-text">
          Открыт быстрый переход к заметкам сессии #{sessionFilter}.
        </p>
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
        onClientFilterChange={setClientFilter}
        onSessionFilterChange={setSessionFilter}
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