import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { CrmClientRecord } from "../../../types/client";
import styles from "./SessionsPage.module.css";

type SessionClientComboboxProps = {
  clients: CrmClientRecord[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
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

export function SessionClientCombobox({
  clients,
  selectedClientId,
  onClientChange,
}: SessionClientComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showFavoriteClientsOnly, setShowFavoriteClientsOnly] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const activeClients = useMemo(
    () => clients.filter((client) => client.status === "active"),
    [clients]
  );

  const selectedClient = useMemo(
    () =>
      activeClients.find((client) => String(client.id) === selectedClientId) ??
      null,
    [activeClients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    const query = normalizeSearchValue(inputValue);

    return activeClients.filter((client) => {
      if (showFavoriteClientsOnly && !client.isFavorite) {
        return false;
      }

      if (!query) {
        return true;
      }

      return getClientSearchText(client).includes(query);
    });
  }, [activeClients, inputValue, showFavoriteClientsOnly]);

  const hasActiveClients = activeClients.length > 0;
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
  }, [inputValue, showFavoriteClientsOnly]);

  useEffect(() => {
    if (!selectedClient) {
      return;
    }

    if (showFavoriteClientsOnly && !selectedClient.isFavorite) {
      onClientChange("");
      setInputValue("");
    }
  }, [onClientChange, selectedClient, showFavoriteClientsOnly]);

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
    <div className={styles.clientPicker}>
      <div className={styles.clientPickerTools}>
        <div ref={rootRef} className={styles.clientCombobox}>
          <div className={styles.clientComboboxField}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleInputKeyDown}
              placeholder={
                hasActiveClients
                  ? "Выберите клиента или начните вводить имя, телефон или email"
                  : "Нет активных клиентов"
              }
              className={`${styles.input} ${styles.clientComboboxInput}`}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              disabled={!hasActiveClients}
            />

            {inputValue ? (
              <button
                type="button"
                className={styles.clientComboboxClear}
                onClick={clearClient}
                aria-label="Очистить выбранного клиента"
              >
                ×
              </button>
            ) : null}
          </div>

          {isOpen && hasActiveClients ? (
            <div
              id={listboxId}
              className={styles.clientComboboxList}
              role="listbox"
            >
              {hasFilteredClients ? (
                filteredClients.map((client, index) => {
                  const isSelected = String(client.id) === selectedClientId;
                  const isHighlighted = index === highlightedIndex;
                  const meta = getClientOptionMeta(client);

                  return (
                    <button
                      key={client.id}
                      type="button"
                      className={[
                        styles.clientComboboxOption,
                        isHighlighted ? styles.clientComboboxOptionActive : "",
                        isSelected ? styles.clientComboboxOptionSelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectClient(client)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className={styles.clientComboboxOptionMain}>
                        <span className={styles.clientComboboxOptionName}>
                          {client.isFavorite ? "★ " : ""}
                          {client.name}
                        </span>

                        {meta ? (
                          <span className={styles.clientComboboxOptionMeta}>
                            {meta}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className={styles.clientComboboxEmpty}>
                  По выбранным условиям клиентов не найдено.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <label className={styles.clientFavoriteToggle}>
          <input
            type="checkbox"
            checked={showFavoriteClientsOnly}
            onChange={(event) =>
              setShowFavoriteClientsOnly(event.target.checked)
            }
            disabled={!hasActiveClients}
          />
          <span>Только избранные</span>
        </label>
      </div>

      <span className={styles.clientPickerHint}>
        {!hasActiveClients
          ? "В списке показываются только активные клиенты. Сейчас активных клиентов нет."
          : showFavoriteClientsOnly
            ? "Сейчас поиск идёт только по активным избранным клиентам."
            : "В списке показываются только активные клиенты. Можно искать по имени, телефону или email."}
      </span>
    </div>
  );
}