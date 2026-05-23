import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import styles from "./ServicesPage.module.css";
import type { PackageActivityFilter } from "./servicesPageHelpers";

type ServicePackagePlanFiltersProps = {
  activityFilter: PackageActivityFilter;
  searchQuery: string;
  onActivityFilterChange: (value: PackageActivityFilter) => void;
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
  searchQuery,
  onActivityFilterChange,
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
    </AdminFiltersRow>
  );
}