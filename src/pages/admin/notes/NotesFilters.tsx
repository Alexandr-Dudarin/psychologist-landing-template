import type { CrmClientRecord } from "../../../types/client";
import type { CrmSessionRecord } from "../../../types/session";

import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import styles from "./NotesPage.module.css";

type NotesFiltersProps = {
  clientFilter: number | "all";
  sessionFilter: number | "all";
  clients: CrmClientRecord[];
  sessions: CrmSessionRecord[];
  searchQuery: string;
  onClientFilterChange: (value: number | "all") => void;
  onSessionFilterChange: (value: number | "all") => void;
  onSearchChange: (value: string) => void;
};

export function NotesFilters({
  clientFilter,
  sessionFilter,
  clients,
  sessions,
  searchQuery,
  onClientFilterChange,
  onSessionFilterChange,
  onSearchChange,
}: NotesFiltersProps) {
  return (
    <AdminFiltersRow>
      <select
        value={clientFilter}
        onChange={(event) =>
          onClientFilterChange(
            event.target.value === "all" ? "all" : Number(event.target.value)
          )
        }
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">все клиенты</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <select
        value={sessionFilter}
        onChange={(event) =>
          onSessionFilterChange(
            event.target.value === "all" ? "all" : Number(event.target.value)
          )
        }
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">
          {clientFilter === "all" ? "все сессии" : "все сессии клиента"}
        </option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            #{session.id} — {session.clientName}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск по клиенту, услуге или тексту заметки"
        className={`${styles.input} ${styles.searchInput}`}
      />
    </AdminFiltersRow>
  );
}