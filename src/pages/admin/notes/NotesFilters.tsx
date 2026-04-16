import type { CrmClientRecord } from "../../../types/client";

import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import styles from "./NotesPage.module.css";

type NotesFiltersProps = {
  clientFilter: number | "all";
  clients: CrmClientRecord[];
  searchQuery: string;
  onClientFilterChange: (value: number | "all") => void;
  onSearchChange: (value: string) => void;
};

export function NotesFilters({
  clientFilter,
  clients,
  searchQuery,
  onClientFilterChange,
  onSearchChange,
}: NotesFiltersProps) {
  return (
    <AdminFiltersRow>
      <select
        value={clientFilter}
        onChange={(event) =>
          onClientFilterChange(
            event.target.value === "all" ? "all" : Number(event.target.value)
          )
        }
        className={`${styles.input} ${styles.filterSelect}`}
      >
        <option value="all">все клиенты</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Поиск по клиенту, тексту или услуге"
        className={`${styles.input} ${styles.searchInput}`}
      />
    </AdminFiltersRow>
  );
}
