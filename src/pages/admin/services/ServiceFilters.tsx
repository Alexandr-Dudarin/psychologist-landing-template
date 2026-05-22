import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import styles from "./ServicesPage.module.css";
import type { ServiceActivityFilter } from "./servicesPageHelpers";

type ServiceFiltersProps = {
  activityFilter: ServiceActivityFilter;
  searchQuery: string;
  onActivityFilterChange: (value: ServiceActivityFilter) => void;
  onSearchQueryChange: (value: string) => void;
};

export function ServiceFilters({
  activityFilter,
  searchQuery,
  onActivityFilterChange,
  onSearchQueryChange,
}: ServiceFiltersProps) {
  return (
    <AdminFiltersRow>
      <select
        value={activityFilter}
        onChange={(event) => {
          onActivityFilterChange(event.target.value as ServiceActivityFilter);
        }}
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">все услуги</option>
        <option value="active">только активные</option>
        <option value="inactive">только неактивные</option>
      </select>

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
