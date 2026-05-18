import { useEffect, useMemo, useRef, useState } from "react";

import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import type {
  ClientFavoriteFilter,
  CrmClientRecord,
} from "../../../types/client";
import styles from "./NotesPage.module.css";

type NotesFiltersProps = {
  clientFilter: number | "all";
  favoriteFilter: ClientFavoriteFilter;
  clients: CrmClientRecord[];
  searchQuery: string;
  onClientFilterChange: (value: number | "all") => void;
  onFavoriteFilterChange: (value: ClientFavoriteFilter) => void;
  onSearchChange: (value: string) => void;
};

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function doesClientMatchSearch(client: CrmClientRecord, query: string): boolean {
  if (!query) {
    return true;
  }

  return [client.name, client.phone, client.email]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
}

function getClientMeta(client: CrmClientRecord): string {
  return [client.phone, client.email].filter(Boolean).join(" · ");
}

export function NotesFilters({
  clientFilter,
  favoriteFilter,
  clients,
  searchQuery,
  onClientFilterChange,
  onFavoriteFilterChange,
  onSearchChange,
}: NotesFiltersProps) {
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const clientPickerRef = useRef<HTMLDivElement | null>(null);
  const showFavoritesOnly = favoriteFilter === "favorites";

  const selectedClient = useMemo(() => {
    if (clientFilter === "all") {
      return null;
    }

    return clients.find((client) => client.id === clientFilter) ?? null;
  }, [clientFilter, clients]);

  const filteredClients = useMemo(() => {
    const query = normalizeSearchValue(clientSearchQuery);

    return clients.filter((client) => {
      if (showFavoritesOnly && !client.isFavorite) {
        return false;
      }

      return doesClientMatchSearch(client, query);
    });
  }, [clientSearchQuery, clients, showFavoritesOnly]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      if (!clientPickerRef.current) {
        return;
      }

      if (!clientPickerRef.current.contains(event.target as Node)) {
        setIsClientPickerOpen(false);
        setClientSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  const handleClientInputFocus = () => {
    setIsClientPickerOpen(true);
    setClientSearchQuery("");
  };

  const handleClientSearchChange = (value: string) => {
    setClientSearchQuery(value);
    setIsClientPickerOpen(true);
  };

  const chooseClient = (value: number | "all") => {
    onClientFilterChange(value);
    setClientSearchQuery("");
    setIsClientPickerOpen(false);
  };

  const clientInputValue = isClientPickerOpen
    ? clientSearchQuery
    : selectedClient?.name ?? "";

  return (
    <AdminFiltersRow>
      <div className={styles.filterClientPicker} ref={clientPickerRef}>
        <input
          type="text"
          value={clientInputValue}
          onFocus={handleClientInputFocus}
          onChange={(event) => handleClientSearchChange(event.target.value)}
          placeholder="Все клиенты или начните вводить имя, телефон, email"
          className={`${styles.input} ${styles.filterClientInput}`}
          aria-expanded={isClientPickerOpen}
        />

        {isClientPickerOpen ? (
          <div className={styles.filterClientDropdown}>
            <button
              type="button"
              className={[
                styles.filterClientOption,
                clientFilter === "all" ? styles.filterClientOptionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseClient("all")}
            >
              <span className={styles.filterClientOptionName}>Все клиенты</span>
            </button>

            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className={[
                    styles.filterClientOption,
                    clientFilter === client.id
                      ? styles.filterClientOptionActive
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseClient(client.id)}
                >
                  <span className={styles.filterClientOptionName}>
                    {client.isFavorite ? "★ " : ""}
                    {client.name}
                  </span>

                  {getClientMeta(client) ? (
                    <span className={styles.filterClientOptionMeta}>
                      {getClientMeta(client)}
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <div className={styles.filterClientEmpty}>
                Клиенты не найдены.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <label className={styles.favoriteFilterToggle}>
        <input
          type="checkbox"
          checked={showFavoritesOnly}
          onChange={(event) =>
            onFavoriteFilterChange(event.target.checked ? "favorites" : "all")
          }
        />
        <span>Только избранные</span>
      </label>

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Поиск по клиенту, услуге или тексту заметки"
        className={`${styles.input} ${styles.searchInput}`}
      />
    </AdminFiltersRow>
  );
}