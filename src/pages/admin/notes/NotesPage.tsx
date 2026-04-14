import { useEffect, useMemo, useState } from "react";
import { getAdminClients } from "../../../lib/api/adminClients";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import {
  getAdminNotes,
  createAdminNote,
  deleteAdminNote,
} from "../../../lib/api/adminNotes";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmSessionRecord } from "../../../types/session";
import type { CreateNotePayload, CrmNoteRecord } from "../../../types/note";

type NoteForm = {
  clientId: string;
  sessionId: string;
  content: string;
};

const initialForm: NoteForm = {
  clientId: "",
  sessionId: "",
  content: "",
};

function formatSessionLabel(session: CrmSessionRecord) {
  return `${new Date(session.scheduledAt).toLocaleString("ru-RU")} — ${session.serviceTitle}`;
}

export function NotesPage() {
  const [items, setItems] = useState<CrmNoteRecord[]>([]);
  const [clients, setClients] = useState<CrmClientRecord[]>([]);
  const [sessions, setSessions] = useState<CrmSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [clientFilter, setClientFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<NoteForm>(initialForm);

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
  }, [clientFilter, searchQuery]);

  const availableSessions = useMemo(() => {
    if (!form.clientId) {
      return [];
    }

    return sessions.filter(
      (session) => session.clientId === Number(form.clientId)
    );
  }, [form.clientId, sessions]);

  const reloadNotes = async () => {
    const notesData = await getAdminNotes({
      clientId: clientFilter,
      search: searchQuery,
    });

    setItems(notesData);
  };

  const handleFormChange = (field: keyof NoteForm, value: string) => {
    if (field === "clientId") {
      setForm((prev) => ({
        ...prev,
        clientId: value,
        sessionId: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateNotePayload = {
      clientId: Number(form.clientId),
      sessionId: form.sessionId ? Number(form.sessionId) : null,
      content: form.content.trim(),
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
      setForm(initialForm);
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

      <section
        style={{
          marginTop: "20px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Создать заметку</h2>

        <form
          onSubmit={handleCreateNote}
          style={{
            display: "grid",
            gap: "12px",
            maxWidth: "720px",
          }}
        >
          <select
            value={form.clientId}
            onChange={(e) => handleFormChange("clientId", e.target.value)}
            style={inputStyle}
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
            onChange={(e) => handleFormChange("sessionId", e.target.value)}
            style={inputStyle}
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
            onChange={(e) => handleFormChange("content", e.target.value)}
            placeholder="Текст заметки"
            style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
          />

          <div>
            <button type="submit" disabled={isCreating} style={buttonStyle}>
              {isCreating ? "Создание..." : "Создать заметку"}
            </button>
          </div>
        </form>
      </section>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "16px",
          marginBottom: "16px",
        }}
      >
        <select
          value={clientFilter}
          onChange={(e) =>
            setClientFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          style={{
            minWidth: "240px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        >
          <option value="all">все клиенты</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по клиенту, тексту или услуге"
          style={{
            minWidth: "320px",
            maxWidth: "420px",
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {error && <p style={{ color: "#d96b6b" }}>{error}</p>}
      {successMessage && <p style={{ color: "#2e8b57" }}>{successMessage}</p>}

      {isLoading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Заметок пока нет.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr>
                <th style={cellHeadStyle}>ID</th>
                <th style={cellHeadStyle}>Создана</th>
                <th style={cellHeadStyle}>Клиент</th>
                <th style={cellHeadStyle}>Сессия</th>
                <th style={cellHeadStyle}>Текст</th>
                <th style={cellHeadStyle}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td style={cellStyle}>{item.clientName}</td>
                  <td style={cellStyle}>
                    {item.sessionId && item.sessionScheduledAt
                      ? `${new Date(item.sessionScheduledAt).toLocaleString("ru-RU")}${
                          item.sessionServiceTitle
                            ? ` — ${item.sessionServiceTitle}`
                            : ""
                        }`
                      : "-"}
                  </td>
                  <td style={cellStyle}>{item.content}</td>
                  <td style={cellStyle}>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(item.id)}
                      disabled={deletingId === item.id}
                      style={buttonStyle}
                    >
                      {deletingId === item.id ? "Удаление..." : "Удалить"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
};

const cellHeadStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontWeight: 700,
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};