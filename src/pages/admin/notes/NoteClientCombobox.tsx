import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { CrmClientRecord } from "../../../types/client";
import styles from "./NotesPage.module.css";

type NoteClientComboboxProps = {
  clients: CrmClientRecord[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
};

type ClientGroup = {
  key: string;
  title: string;
  clients: CrmClientRecord[];
};

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function getClientSearchText(client: CrmClientRecord): string {
  return [client.name, client.phone, client.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getClientOptionMeta(client: CrmClientRecord): string {
  return [client.phone, client.email].filter(Boolean).join(" · ");
}

function getClientInputLabel(client: CrmClientRecord): string {
  const contact = client.phone || client.email;

  return contact ? `${client.name} — ${contact}` : client.name;
}

function clientMatchesQuery(client: CrmClientRecord, query: string): boolean {
  if (!query) {
    return true;
  }

  return getClientSearchText(client).includes(query);
}

function buildClientGroups(
  clients: CrmClientRecord[],
  query: string
): ClientGroup[] {
  const favoriteClients = clients.filter(
    (client) => client.isFavorite && clientMatchesQuery(client, query)
  );
  const favoriteClientIds = new Set(
    favoriteClients.map((client) => client.id)
  );

  const activeClients = clients.filter(
    (client) =>
      client.status === "active" &&
      !favoriteClientIds.has(client.id) &&
      clientMatchesQuery(client, query)
  );

  const inactiveClients = clients.filter(
    (client) =>
      client.status === "inactive" &&
      !favoriteClientIds.has(client.id) &&
      clientMatchesQuery(client, query)
  );

  return [
    {
      key: "favorites",
      title: "Избранные клиенты",
      clients: favoriteClients,
    },
    {
      key: "active",
      title: "Активные клиенты",
      clients: activeClients,
    },
    {
      key: "inactive",
      title: "Неактивные клиенты",
      clients: inactiveClients,
    },
  ].filter((group) => group.clients.length > 0);
}

export function NoteClientCombobox({
  clients,
  selectedClientId,
  onClientChange,
}: NoteClientComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedClient = useMemo(
    () =>
      clients.find((client) => String(client.id) === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const groupedClients = useMemo(
    () => buildClientGroups(clients, normalizeSearchValue(inputValue)),
    [clients, inputValue]
  );

  const filteredClients = useMemo(
    () => groupedClients.flatMap((group) => group.clients),
    [groupedClients]
  );

  const hasClients = clients.length > 0;
  const hasFilteredClients = filteredClients.length > 0;

  useEffect(() => {
    if (!selectedClientId) {
      setInputValue("");
      return;
    }

    if (selectedClient) {
      setInputValue(getClientInputLabel(selectedClient));
    }
  }, [selectedClient, selectedClientId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue, clients]);

  const selectClient = (client: CrmClientRecord) => {
    onClientChange(String(client.id));
    setInputValue(getClientInputLabel(client));
    setIsOpen(false);
  };

  const clearClient = () => {
    onClientChange("");
    setInputValue("");
    setIsOpen(true);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleInputChange = (value: string) => {
    if (selectedClientId) {
      onClientChange("");
    }

    setInputValue(value);
    setIsOpen(true);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!hasFilteredClients) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, filteredClients.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      selectClient(filteredClients[highlightedIndex] ?? filteredClients[0]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={styles.noteClientCombobox}>
      <div className={styles.noteClientComboboxField}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={
            hasClients
              ? "Выберите клиента или начните вводить имя, телефон или email"
              : "Клиентов пока нет"
          }
          className={`${styles.input} ${styles.noteClientComboboxInput}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={!hasClients}
        />

        {inputValue ? (
          <button
            type="button"
            className={styles.noteClientComboboxClear}
            onClick={clearClient}
            aria-label="Очистить выбранного клиента"
          >
            ×
          </button>
        ) : null}
      </div>

      {isOpen && hasClients ? (
        <div
          id={listboxId}
          className={styles.noteClientComboboxList}
          role="listbox"
        >
          {hasFilteredClients ? (
            groupedClients.map((group) => (
              <div key={group.key} className={styles.noteClientComboboxGroup}>
                <div className={styles.noteClientComboboxGroupTitle}>
                  {group.title}
                </div>

                {group.clients.map((client) => {
                  const index = filteredClients.findIndex(
                    (item) => item.id === client.id
                  );
                  const isSelected = String(client.id) === selectedClientId;
                  const isHighlighted = index === highlightedIndex;
                  const meta = getClientOptionMeta(client);

                  return (
                    <button
                      key={client.id}
                      type="button"
                      className={[
                        styles.noteClientComboboxOption,
                        isHighlighted
                          ? styles.noteClientComboboxOptionActive
                          : "",
                        isSelected
                          ? styles.noteClientComboboxOptionSelected
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectClient(client)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className={styles.noteClientComboboxOptionMain}>
                        <span className={styles.noteClientComboboxOptionName}>
                          {client.isFavorite ? "★ " : ""}
                          {client.name}
                        </span>

                        {meta ? (
                          <span className={styles.noteClientComboboxOptionMeta}>
                            {meta}
                          </span>
                        ) : (
                          <span className={styles.noteClientComboboxOptionMeta}>
                            Контакты не указаны
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className={styles.noteClientComboboxEmpty}>
              По выбранным условиям клиентов не найдено.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}