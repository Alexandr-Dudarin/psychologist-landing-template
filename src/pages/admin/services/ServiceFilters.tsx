import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import styles from "./ServicesPage.module.css";
import type { ServiceActivityFilter } from "./servicesPageHelpers";

type ServiceFiltersProps = {
  activityFilter: ServiceActivityFilter;
  hasActiveFilters: boolean;
  searchQuery: string;
  onActivityFilterChange: (value: ServiceActivityFilter) => void;
  onResetFilters: () => void;
  onSearchQueryChange: (value: string) => void;
};

const serviceActivityFilterOptions: CustomSelectOption[] = [
  {
    value: "all",
    label: "все услуги",
  },
  {
    value: "active",
    label: "только активные",
  },
  {
    value: "inactive",
    label: "только неактивные",
  },
];

export function ServiceFilters({
  activityFilter,
  hasActiveFilters,
  searchQuery,
  onActivityFilterChange,
  onResetFilters,
  onSearchQueryChange,
}: ServiceFiltersProps) {
  return (
    <AdminFiltersRow>
      <CustomSelect
        value={activityFilter}
        options={serviceActivityFilterOptions}
        ariaLabel="Фильтр активности услуг"
        variant="admin"
        layout="filter"
        onChange={(value) => {
          onActivityFilterChange(value as ServiceActivityFilter);
        }}
      />

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => {
          onSearchQueryChange(event.target.value);
        }}
        placeholder="Поиск по названию или описанию"
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