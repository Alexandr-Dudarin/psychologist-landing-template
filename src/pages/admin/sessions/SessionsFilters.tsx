import { useEffect, useMemo, useRef, useState } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import type {
  ClientFavoriteFilter,
  CrmClientRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type { SessionStatus } from "../../../types/session";
import { sessionStatuses } from "../../../types/session";
import { sessionStatusLabels } from "./sessionForm";
import styles from "./SessionsPage.module.css";

type SessionsFiltersProps = {
  clientFilter: number | "all";
  clients: CrmClientRecord[];
  dateFilter: string | null;
  favoriteFilter: ClientFavoriteFilter;
  serviceFilter: number | "all";
  services: CrmServiceRecord[];
  statusFilter: SessionStatus | "all";
  hasActiveFilters: boolean;
  onClientFilterChange: (value: number | "all") => void;
  onDateFilterChange: (value: string) => void;
  onDateTodayClick: () => void;
  onFavoriteFilterChange: (value: ClientFavoriteFilter) => void;
  onServiceFilterChange: (value: number | "all") => void;
  onStatusFilterChange: (value: SessionStatus | "all") => void;
  onResetFilters: () => void;
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

function getSortedServiceOptions(
  services: CrmServiceRecord[]
): CrmServiceRecord[] {
  return [...services].sort((first, second) => {
    if (first.isActive !== second.isActive) {
      return first.isActive ? -1 : 1;
    }

    return first.title.localeCompare(second.title, "ru");
  });
}

export function SessionsFilters({
  clientFilter,
  clients,
  dateFilter,
  favoriteFilter,
  serviceFilter,
  services,
  statusFilter,
  hasActiveFilters,
  onClientFilterChange,
  onDateFilterChange,
  onDateTodayClick,
  onFavoriteFilterChange,
  onServiceFilterChange,
  onStatusFilterChange,
  onResetFilters,
}: SessionsFiltersProps) {
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

  const serviceOptions = useMemo(
    () => getSortedServiceOptions(services),
    [services]
  );

  const statusSelectOptions = useMemo<CustomSelectOption[]>(
    () => [
      { value: "all", label: "Все статусы" },
      ...sessionStatuses.map((status) => ({
        value: status,
        label: sessionStatusLabels[status],
      })),
    ],
    []
  );

  const serviceSelectOptions = useMemo<CustomSelectOption[]>(
    () => [
      { value: "all", label: "Все услуги" },
      ...serviceOptions.map((service) => ({
        value: String(service.id),
        label: service.isActive ? service.title : `${service.title} — скрыта`,
      })),
    ],
    [serviceOptions]
  );

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
            onFavoriteFilterChange(
              event.target.checked ? "favorites" : "all"
            )
          }
        />
        <span>Только избранные</span>
      </label>

      <div className={styles.dateFilterGroup}>
        <input
          type="date"
          value={dateFilter ?? ""}
          onChange={(event) => onDateFilterChange(event.target.value)}
          className={`${styles.input} ${styles.dateFilterInput}`}
          aria-label="Фильтр по дате сессии"
        />

        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          className={styles.dateTodayButton}
          onClick={onDateTodayClick}
        >
          Сегодня
        </AdminButton>
      </div>

      <CustomSelect
        value={statusFilter}
        options={statusSelectOptions}
        ariaLabel="Фильтр по статусу сессии"
        variant="admin"
        layout="filter"
        onChange={(value) =>
          onStatusFilterChange(value as SessionStatus | "all")
        }
      />

      <CustomSelect
        value={serviceFilter === "all" ? "all" : String(serviceFilter)}
        options={serviceSelectOptions}
        ariaLabel="Фильтр по услуге"
        variant="admin"
        layout="filter"
        dropdownAlign="end"
        className={styles.serviceFilterSelect}
        onChange={(value) =>
          onServiceFilterChange(value === "all" ? "all" : Number(value))
        }
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