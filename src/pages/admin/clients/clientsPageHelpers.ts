import type {
  ClientFavoriteFilter,
  ClientStatus,
  CrmClientRecord,
} from "../../../types/client";

export type ClientsPageFilters = {
  statusFilter: ClientStatus | "all";
  favoriteFilter: ClientFavoriteFilter;
  searchQuery: string;
};

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function doesClientMatchSearch(
  client: CrmClientRecord,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  return [client.name, client.phone, client.email]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function filterClients(
  clients: CrmClientRecord[],
  { statusFilter, favoriteFilter, searchQuery }: ClientsPageFilters
): CrmClientRecord[] {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  return clients.filter((client) => {
    if (statusFilter !== "all" && client.status !== statusFilter) {
      return false;
    }

    if (
      favoriteFilter === "favorites" &&
      (!client.isFavorite || client.status !== "active")
    ) {
      return false;
    }

    return doesClientMatchSearch(client, normalizedQuery);
  });
}
