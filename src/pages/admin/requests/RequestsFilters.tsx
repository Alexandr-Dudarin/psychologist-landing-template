import { useMemo } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import type { RequestStatus } from "../../../types/request";
import styles from "./RequestsFilters.module.css";

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
  hasActiveFilters: boolean;
  resetLabel: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: RequestStatus | "all") => void;
  onResetFilters: () => void;
};

export function RequestsFilters({
  allStatusesLabel,
  searchPlaceholder,
  searchQuery,
  statusFilter,
  statusOptions,
  hasActiveFilters,
  resetLabel,
  onSearchChange,
  onStatusChange,
  onResetFilters,
}: RequestsFiltersProps) {
  const requestStatusOptions = useMemo<CustomSelectOption[]>(
    () => [
      {
        value: "all",
        label: allStatusesLabel,
      },
      ...statusOptions.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    ],
    [allStatusesLabel, statusOptions]
  );

  return (
    <AdminFiltersRow>
      <CustomSelect
        value={statusFilter}
        options={requestStatusOptions}
        onChange={(value) => onStatusChange(value as RequestStatus | "all")}
        ariaLabel="Фильтр по статусу заявки"
        variant="admin"
        layout="filter"
      />

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className={styles.searchInput}
      />

      <AdminButton
        type="button"
        variant="danger"
        onClick={hasActiveFilters ? onResetFilters : undefined}
        disabled={!hasActiveFilters}
        aria-hidden={!hasActiveFilters}
        tabIndex={hasActiveFilters ? 0 : -1}
        className={`${styles.filtersResetButton} ${hasActiveFilters
            ? styles.filtersResetButtonVisible
            : styles.filtersResetButtonHidden
          }`}
      >
        {resetLabel}
      </AdminButton>
    </AdminFiltersRow>
  );
}