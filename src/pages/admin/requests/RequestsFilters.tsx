import { useMemo } from "react";

import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
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
    </AdminFiltersRow>
  );
}