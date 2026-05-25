import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import styles from "./ServicesPage.module.css";
import type { PackageActivityFilter } from "./servicesPageHelpers";

type ServicePackagePlanFiltersProps = {
  activityFilter: PackageActivityFilter;
  hasActiveFilters: boolean;
  searchQuery: string;
  onActivityFilterChange: (value: PackageActivityFilter) => void;
  onResetFilters: () => void;
  onSearchQueryChange: (value: string) => void;
};

const packageActivityFilterOptions: CustomSelectOption[] = [
  {
    value: "all",
    label: "все пакеты",
  },
  {
    value: "active",
    label: "только активные",
  },
  {
    value: "inactive",
    label: "только скрытые",
  },
];

export function ServicePackagePlanFilters({
  activityFilter,
  hasActiveFilters,
  searchQuery,
  onActivityFilterChange,
  onResetFilters,
  onSearchQueryChange,
}: ServicePackagePlanFiltersProps) {
  return (
    <AdminFiltersRow>
      <CustomSelect
        value={activityFilter}
        options={packageActivityFilterOptions}
        ariaLabel="Фильтр активности пакетов услуг"
        variant="admin"
        layout="filter"
        onChange={(value) => {
          onActivityFilterChange(value as PackageActivityFilter);
        }}
      />

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => {
          onSearchQueryChange(event.target.value);
        }}
        placeholder="Поиск по названию, описанию или базовой услуге"
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