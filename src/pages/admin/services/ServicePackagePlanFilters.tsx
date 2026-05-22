import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import styles from "./ServicesPage.module.css";
import type { PackageActivityFilter } from "./servicesPageHelpers";

type ServicePackagePlanFiltersProps = {
  activityFilter: PackageActivityFilter;
  searchQuery: string;
  onActivityFilterChange: (value: PackageActivityFilter) => void;
  onSearchQueryChange: (value: string) => void;
};

export function ServicePackagePlanFilters({
  activityFilter,
  searchQuery,
  onActivityFilterChange,
  onSearchQueryChange,
}: ServicePackagePlanFiltersProps) {
  return (
    <AdminFiltersRow>
      <select
        value={activityFilter}
        onChange={(event) => {
          onActivityFilterChange(event.target.value as PackageActivityFilter);
        }}
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">все пакеты</option>
        <option value="active">только активные</option>
        <option value="inactive">только скрытые</option>
      </select>

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
