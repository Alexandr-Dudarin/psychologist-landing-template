import type { RequestStatus } from "../../../types/request";

import styles from "./RequestsPage.module.css";

type StatusOption = {
  value: RequestStatus;
  label: string;
};

type RequestsFiltersProps = {
  allStatusesLabel: string;
  searchPlaceholder: string;
  searchQuery: string;
  statusFilter: RequestStatus | "all";
  statusOptions: StatusOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: RequestStatus | "all") => void;
};

export function RequestsFilters({
  allStatusesLabel,
  searchPlaceholder,
  searchQuery,
  statusFilter,
  statusOptions,
  onSearchChange,
  onStatusChange,
}: RequestsFiltersProps) {
  return (
    <div className={styles.filtersRow}>
      <select
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(event.target.value as RequestStatus | "all")
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
