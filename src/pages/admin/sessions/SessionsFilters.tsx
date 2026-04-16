import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import { sessionStatusLabels } from "./sessionForm";

type SessionsFiltersProps = {
  statusFilter: SessionStatus | "all";
  searchQuery: string;
  onStatusFilterChange: (value: SessionStatus | "all") => void;
  onSearchQueryChange: (value: string) => void;
};

export function SessionsFilters({
  statusFilter,
  searchQuery,
  onStatusFilterChange,
  onSearchQueryChange,
}: SessionsFiltersProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "16px",
        marginBottom: "16px",
      }}
    >
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as SessionStatus | "all")}
        style={{
          minWidth: "180px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      >
        <option value="all">все статусы</option>
        {sessionStatuses.map((status) => (
          <option key={status} value={status}>
            {sessionStatusLabels[status]}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="Поиск по клиенту, услуге или заметке"
        style={{
          minWidth: "320px",
          maxWidth: "420px",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}