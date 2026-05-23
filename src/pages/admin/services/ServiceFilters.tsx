import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import styles from "./ServicesPage.module.css";
import type { ServiceActivityFilter } from "./servicesPageHelpers";

type ServiceFiltersProps = {
  activityFilter: ServiceActivityFilter;
  searchQuery: string;
  onActivityFilterChange: (value: ServiceActivityFilter) => void;
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
  searchQuery,
  onActivityFilterChange,
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
    </AdminFiltersRow>
  );
}