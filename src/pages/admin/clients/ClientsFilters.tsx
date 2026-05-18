import type {
  ClientFavoriteFilter,
  ClientStatus,
} from "../../../types/client";

import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import styles from "./ClientsPage.module.css";

type StatusOption = {
  value: ClientStatus;
  label: string;
};

type ClientsFiltersProps = {
  allStatusesLabel: string;
  searchPlaceholder: string;
  searchQuery: string;
  statusFilter: ClientStatus | "all";
  favoriteFilter: ClientFavoriteFilter;
  statusOptions: StatusOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ClientStatus | "all") => void;
  onFavoriteChange: (value: ClientFavoriteFilter) => void;
};

export function ClientsFilters({
  allStatusesLabel,
  searchPlaceholder,
  searchQuery,
  statusFilter,
  favoriteFilter,
  statusOptions,
  onSearchChange,
  onStatusChange,
  onFavoriteChange,
}: ClientsFiltersProps) {
  const showFavoritesOnly = favoriteFilter === "favorites";

  return (
    <AdminFiltersRow>
      <select
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(event.target.value as ClientStatus | "all")
        }
        className={`${styles.input} ${styles.select}`}
      >
        <option value="all">{allStatusesLabel}</option>
        {statusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <label className={styles.favoriteFilterToggle}>
        <input
          type="checkbox"
          checked={showFavoritesOnly}
          onChange={(event) =>
            onFavoriteChange(event.target.checked ? "favorites" : "all")
          }
        />
        <span>Только избранные</span>
      </label>

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className={`${styles.input} ${styles.searchInput}`}
      />
    </AdminFiltersRow>
  );
}