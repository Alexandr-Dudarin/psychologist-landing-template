import type { CrmClientRecord } from "../../../types/client";
import type { SessionStatus } from "../../../types/session";

import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { sessionStatuses } from "../../../types/session";
import { sessionStatusLabels } from "./sessionForm";
import styles from "./SessionsPage.module.css";

type SessionsFiltersProps = {
  clientFilter: number | "all";
  clients: CrmClientRecord[];
  statusFilter: SessionStatus | "all";
  searchQuery: string;
  onClientFilterChange: (value: number | "all") => void;
  onStatusFilterChange: (value: SessionStatus | "all") => void;
  onSearchQueryChange: (value: string) => void;
};

export function SessionsFilters({
  clientFilter,
  clients,
  statusFilter,
  searchQuery,
  onClientFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
}: SessionsFiltersProps) {
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
        value={statusFilter}
        onChange={(e) =>
          onStatusFilterChange(e.target.value as SessionStatus | "all")
        }
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">все статусы</option>
        {sessionStatuses.map((status) => (
          <option key={status} value={status}>
            {sessionStatusLabels[status]}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="Поиск по клиенту, услуге или заметке"
        className={`${styles.input} ${styles.searchInput}`}
      />
    </AdminFiltersRow>
  );
}
