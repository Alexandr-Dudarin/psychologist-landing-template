import type { ClientStatus } from "../../../types/client";

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
  statusOptions: StatusOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ClientStatus | "all") => void;
};

export function ClientsFilters({
  allStatusesLabel,
  searchPlaceholder,
  searchQuery,
  statusFilter,
  statusOptions,
  onSearchChange,
  onStatusChange,
}: ClientsFiltersProps) {
  return (
    <div className={styles.filtersRow}>
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

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className={`${styles.input} ${styles.searchInput}`}
      />
    </div>
  );
}
