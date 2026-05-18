import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import type {
  ClientFavoriteFilter,
  CrmClientRecord,
} from "../../../types/client";
import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import { sessionStatusLabels } from "./sessionForm";
import styles from "./SessionsPage.module.css";

type SessionsFiltersProps = {
  clientFilter: number | "all";
  clients: CrmClientRecord[];
  favoriteFilter: ClientFavoriteFilter;
  statusFilter: SessionStatus | "all";
  searchQuery: string;
  hasActiveFilters: boolean;
  onClientFilterChange: (value: number | "all") => void;
  onFavoriteFilterChange: (value: ClientFavoriteFilter) => void;
  onStatusFilterChange: (value: SessionStatus | "all") => void;
  onSearchQueryChange: (value: string) => void;
  onResetFilters: () => void;
};

export function SessionsFilters({
  clientFilter,
  clients,
  favoriteFilter,
  statusFilter,
  searchQuery,
  hasActiveFilters,
  onClientFilterChange,
  onFavoriteFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
  onResetFilters,
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
        <option value="all">Все клиенты</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <label className={styles.favoriteFilterToggle}>
        <input
          type="checkbox"
          checked={favoriteFilter === "favorites"}
          onChange={(event) =>
            onFavoriteFilterChange(
              event.target.checked ? "favorites" : "all"
            )
          }
        />
        <span>Только избранные</span>
      </label>

      <select
        value={statusFilter}
        onChange={(e) =>
          onStatusFilterChange(e.target.value as SessionStatus | "all")
        }
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">Все статусы</option>
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

      {hasActiveFilters ? (
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          className={styles.filtersResetButton}
          onClick={onResetFilters}
        >
          Сбросить
        </AdminButton>
      ) : null}
    </AdminFiltersRow>
  );
}