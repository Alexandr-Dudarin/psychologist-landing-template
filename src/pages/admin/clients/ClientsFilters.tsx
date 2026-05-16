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

      <select
        value={favoriteFilter}
        onChange={(event) =>
          onFavoriteChange(event.target.value as ClientFavoriteFilter)
        }
        className={`${styles.input} ${styles.select}`}
      >
        <option value="all">все клиенты</option>
        <option value="favorites">только избранные</option>
      </select>

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