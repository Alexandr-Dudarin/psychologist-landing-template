import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AdminCollapsibleCreateSection } from "../../../components/admin/AdminCollapsibleCreateSection";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminRefreshableTableArea } from "../../../components/admin/AdminRefreshableTableArea";
import { getAdminClients } from "../../../lib/api/adminClients";
import {
  createAdminNote,
  deleteAdminNote,
  getAdminNotes,
  updateAdminNote,
} from "../../../lib/api/adminNotes";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type {
  ClientFavoriteFilter,
  CrmClientRecord,
} from "../../../types/client";
import type { CrmNoteRecord } from "../../../types/note";
import type { CrmSessionRecord } from "../../../types/session";
import { NoteCreateForm } from "./NoteCreateForm";
import { NoteDetailsModal } from "./NoteDetailsModal";
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
  getNotesFilteredByFavoriteClients,
  getSessionsForClient,
  hasActiveQuickViewState,
  type NotesPageFilterValue,
} from "./notesPageHelpers";
import { NotesQuickViewBanner } from "./NotesQuickViewBanner";
import { NotesTable } from "./NotesTable";

const createFormPanelId = "note-create-form-panel";

export function NotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmNoteRecord[]>([]);
  const [lastVisibleItems, setLastVisibleItems] = useState<CrmNoteRecord[]>([]);
  const [hasLoadedNotesOnce, setHasLoadedNotesOnce] = useState(false);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [sessions, setSessions] = useState<CrmSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [clientFilter, setClientFilter] =
    useState<NotesPageFilterValue>("all");
  const [favoriteFilter, setFavoriteFilter] =
    useState<ClientFavoriteFilter>("all");
  const [sessionFilter, setSessionFilter] =
    useState<NotesPageFilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<NoteForm>(initialCreateForm);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [selectedDetailsNote, setSelectedDetailsNote] =
    useState<CrmNoteRecord | null>(null);
  const [editForm, setEditForm] = useState<NoteForm>(initialEditForm);
  const [editScrollRequest, setEditScrollRequest] = useState(0);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setClientFilter(getFilterValueFromSearchParam(searchParams.get("clientId")));
    setSessionFilter(
      getFilterValueFromSearchParam(searchParams.get("sessionId"))
    );
  }, [searchParams]);

  useEffect(() => {
    if (editingNoteId === null || editScrollRequest === 0) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const element = editFormRef.current;

      if (!element) {
        return;
      }

      const elementTop = element.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: Math.max(elementTop - 16, 0),
        behavior: "smooth",
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [editingNoteId, editScrollRequest]);

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
          setItems(
            getNotesFilteredByFavoriteClients(
              notesData,
              clientsData,
              favoriteFilter
            )
          );
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
  }, [clientFilter, sessionFilter, searchQuery, favoriteFilter]);

  useEffect(() => {
    if (!isLoading) {
      setLastVisibleItems(items);
      setHasLoadedNotesOnce(true);
    }
  }, [isLoading, items]);

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

    setItems(
      getNotesFilteredByFavoriteClients(notesData, clients, favoriteFilter)
    );
  };

  const handleClientFilterChange = (value: NotesPageFilterValue) => {
    setClientFilter(value);
    setSessionFilter("all");
    resetMessages();
  };

  const handleFavoriteFilterChange = (value: ClientFavoriteFilter) => {
    setFavoriteFilter(value);
    resetMessages();

    if (value !== "favorites" || clientFilter === "all") {
      return;
    }

    const selectedClient = clients.find((client) => client.id === clientFilter);

    if (!selectedClient?.isFavorite) {
      setClientFilter("all");
      setSessionFilter("all");
    }
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    resetMessages();
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
      setIsCreateFormOpen(false);
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
    setEditScrollRequest((prev) => prev + 1);
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

      if (selectedDetailsNote?.id === id) {
        setSelectedDetailsNote(null);
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
    setFavoriteFilter("all");
    setSessionFilter("all");
    setSearchQuery("");
    navigate("/admin/notes");
  };

  const hasActiveFilters =
    clientFilter !== "all" ||
    favoriteFilter !== "all" ||
    sessionFilter !== "all" ||
    searchQuery.trim().length > 0;

  const hasQuickViewState = hasActiveQuickViewState({
    clientFilter,
    sessionFilter,
    searchQuery,
  });

  const displayedItems =
    isLoading && hasLoadedNotesOnce ? lastVisibleItems : items;
  const isInitialLoading = isLoading && !hasLoadedNotesOnce;
  const isRefreshing = isLoading && hasLoadedNotesOnce;

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

      <AdminCollapsibleCreateSection
        title="Создание заметки"
        description="Форма скрыта по умолчанию, чтобы фильтры и список заметок были ближе к началу страницы."
        isOpen={isCreateFormOpen}
        onToggle={() => {
          setIsCreateFormOpen((current) => !current);
          resetMessages();
        }}
        panelId={createFormPanelId}
        openLabel="Скрыть форму"
        closedLabel="Создать заметку"
      >
        <NoteCreateForm
          clients={clients}
          availableSessions={availableCreateSessions}
          form={createForm}
          isCreating={isCreating}
          onChange={handleCreateFormChange}
          onSubmit={handleCreateNote}
        />
      </AdminCollapsibleCreateSection>

      {editingNoteId !== null ? (
        <div ref={editFormRef}>
          <NoteEditForm
            clients={clients}
            availableSessions={availableEditSessions}
            form={editForm}
            isUpdating={isUpdating}
            onCancel={cancelEditing}
            onChange={handleEditFormChange}
            onSubmit={handleUpdateNote}
          />
        </div>
      ) : null}

      <NotesFilters
        clientFilter={clientFilter}
        favoriteFilter={favoriteFilter}
        clients={clients}
        searchQuery={searchQuery}
        hasActiveFilters={hasActiveFilters}
        onClientFilterChange={handleClientFilterChange}
        onFavoriteFilterChange={handleFavoriteFilterChange}
        onSearchChange={handleSearchQueryChange}
        onResetFilters={handleResetView}
      />

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {isInitialLoading ? (
        <p>Загрузка...</p>
      ) : displayedItems.length === 0 ? (
        <AdminRefreshableTableArea isRefreshing={isRefreshing}>
          <p>Заметок пока нет.</p>
        </AdminRefreshableTableArea>
      ) : (
        <AdminRefreshableTableArea isRefreshing={isRefreshing}>
          <NotesTable
            items={displayedItems}
            deletingId={deletingId}
            onEdit={startEditing}
            onDelete={handleDeleteNote}
            onShowDetails={setSelectedDetailsNote}
          />
        </AdminRefreshableTableArea>
      )}

      <NoteDetailsModal
        note={selectedDetailsNote}
        onClose={() => setSelectedDetailsNote(null)}
      />
    </main>
  );
}