import { useMemo } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { CustomCheckbox } from "../../../components/ui/CustomCheckbox";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import type {
  ClientFavoriteFilter,
  ClientStatus,
} from "../../../types/client";
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
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ClientStatus | "all") => void;
  onFavoriteChange: (value: ClientFavoriteFilter) => void;
  onResetFilters: () => void;
};

export function ClientsFilters({
  allStatusesLabel,
  searchPlaceholder,
  searchQuery,
  statusFilter,
  favoriteFilter,
  statusOptions,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onFavoriteChange,
  onResetFilters,
}: ClientsFiltersProps) {
  const showFavoritesOnly = favoriteFilter === "favorites";

  const statusSelectOptions = useMemo<CustomSelectOption[]>(
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
        options={statusSelectOptions}
        onChange={(value) => onStatusChange(value as ClientStatus | "all")}
        ariaLabel="Фильтр по статусу клиента"
        variant="admin"
        layout="filter"
        className={styles.statusFilterSelect}
      />

      <CustomCheckbox
        checked={showFavoritesOnly}
        onChange={(checked) => onFavoriteChange(checked ? "favorites" : "all")}
        className={styles.favoriteFilterToggle}
        ariaLabel="Показывать только избранных клиентов"
      >
        Только избранные
      </CustomCheckbox>

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
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