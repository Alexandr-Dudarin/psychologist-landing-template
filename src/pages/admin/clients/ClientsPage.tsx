import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useLanguage } from "../../../app/providers/LanguageProvider";
import { siteSettings } from "../../../data/siteSettings";
import {
  createManualClient,
  getAdminClients,
  toggleClientFavorite,
  updateClient,
} from "../../../lib/api/adminClients";
import { validatePreferredContactFields } from "../../../lib/preferredContact";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import type {
  ClientFavoriteFilter,
  ClientStatus,
  CreateManualClientPayload,
  CrmClientRecord,
} from "../../../types/client";
import { clientStatuses } from "../../../types/client";
import { ClientCreateForm } from "./ClientCreateForm";
import { ClientDetailsModal } from "./ClientDetailsModal";
import { ClientEditForm } from "./ClientEditForm";
import { ClientsFilters } from "./ClientsFilters";
import { ClientsTable } from "./ClientsTable";
import {
  buildClientName,
  initialForm,
  mapClientToForm,
  splitClientName,
  validateClientNameParts,
  type ClientForm,
  type ManualClientForm,
} from "./clientForm";
import styles from "./ClientsPage.module.css";

const clientSourceLabels: Record<string, string> = {
  manual: "Вручную",
  website: "Сайт",
};

export function ClientsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const preferredContactSettings = siteSettings.preferredContactMethod;
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [favoriteUpdatingId, setFavoriteUpdatingId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [favoriteFilter, setFavoriteFilter] =
    useState<ClientFavoriteFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedClientId, setHighlightedClientId] = useState<number | null>(
    null
  );
  const [form, setForm] = useState<ManualClientForm>(initialForm);
  const [lastName, setLastName] = useState("");
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClientForm>(initialForm);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  const statusOptions = useMemo(
    () =>
      clientStatuses.map((status) => ({
        value: status,
        label: t.admin.clients.statusLabels[status],
      })),
    [t.admin.clients.statusLabels]
  );

  const selectedClient = useMemo(
    () => items.find((item) => item.id === selectedClientId) ?? null,
    [items, selectedClientId]
  );

  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    const highlightFromUrl = searchParams.get("highlightClientId");

    setSearchQuery(searchFromUrl ?? "");

    if (highlightFromUrl !== null) {
      const parsedId = Number(highlightFromUrl);

      setHighlightedClientId(
        Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
      );
      setStatusFilter("all");
    } else {
      setHighlightedClientId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const clients = await getAdminClients({
          status: statusFilter,
          favorite: favoriteFilter,
          search: searchQuery,
        });

        if (isMounted) {
          setItems(clients);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t.admin.clients.messages.loadError
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [
    statusFilter,
    favoriteFilter,
    searchQuery,
    t.admin.clients.messages.loadError,
  ]);

  useEffect(() => {
    if (editingClientId === null) {
      return;
    }

    window.setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, [editingClientId]);

  const resetMessages = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleFormChange = (field: keyof ManualClientForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetMessages();
  };

  const handleEditFormChange = (field: keyof ClientForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetMessages();
  };

  const reloadClients = async () => {
    const clients = await getAdminClients({
      status: statusFilter,
      favorite: favoriteFilter,
      search: searchQuery,
    });

    setItems(clients);
  };

  const handleCreateClient = async (event: FormEvent) => {
    event.preventDefault();

    const nameErrors = validateClientNameParts(form.name, lastName);

    if (nameErrors.firstName || nameErrors.lastName) {
      setError(nameErrors.firstName ?? nameErrors.lastName ?? "");
      return;
    }

    const fullName = buildClientName(form.name, lastName);

    const payload: CreateManualClientPayload = {
      name: fullName,
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source.trim() || "manual",
      preferredContactMethod: preferredContactSettings.enabled
        ? form.preferredContactMethod
        : "",
      preferredContactValue: preferredContactSettings.enabled
        ? form.preferredContactValue.trim()
        : "",
    };

    if (!payload.name) {
      setError(t.admin.clients.messages.nameRequired);
      return;
    }

    if (!payload.phone && !payload.email) {
      setError(t.admin.clients.messages.phoneOrEmailRequired);
      return;
    }

    const preferredContactErrors = validatePreferredContactFields(
      {
        preferredContactMethod: payload.preferredContactMethod ?? "",
        preferredContactValue: payload.preferredContactValue ?? "",
      },
      preferredContactSettings
    );

    if (
      preferredContactErrors.preferredContactMethod ||
      preferredContactErrors.preferredContactValue
    ) {
      setError(
        preferredContactErrors.preferredContactMethod ??
          preferredContactErrors.preferredContactValue ??
          ""
      );
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await createManualClient(payload);

      setForm(initialForm);
      setLastName("");

      if (result.alreadyExisted) {
        setStatusFilter("all");
        setFavoriteFilter("all");
        setSearchQuery("");
        setSuccessMessage(t.admin.clients.messages.alreadyExists);
        navigate(`/admin/clients?highlightClientId=${result.item.id}`);
      } else {
        await reloadClients();
        setSuccessMessage(t.admin.clients.messages.createSuccess);
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t.admin.clients.messages.createError
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (client: CrmClientRecord) => {
    setEditingClientId(client.id);
    setEditForm(mapClientToForm(client));
    resetMessages();
  };

  const openClientDetails = (client: CrmClientRecord) => {
    setSelectedClientId(client.id);
  };

  const closeClientDetails = () => {
    setSelectedClientId(null);
  };

  const cancelEditing = () => {
    setEditingClientId(null);
    setEditForm(initialForm);
  };

  const handleToggleFavorite = async (client: CrmClientRecord) => {
    if (client.status !== "active") {
      setError("В избранное можно добавить только активного клиента.");
      setSuccessMessage("");
      return;
    }

    setFavoriteUpdatingId(client.id);
    setError("");
    setSuccessMessage("");

    try {
      const updatedClient = await toggleClientFavorite(client.id);

      await reloadClients();

      setSuccessMessage(
        updatedClient.isFavorite
          ? "Клиент добавлен в избранное."
          : "Клиент убран из избранного."
      );
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "Не удалось изменить избранное"
      );
    } finally {
      setFavoriteUpdatingId(null);
    }
  };

  const handleUpdateClient = async (event: FormEvent) => {
    event.preventDefault();

    if (editingClientId === null) {
      return;
    }

    const editNameParts = splitClientName(editForm.name);
    const nameErrors = validateClientNameParts(
      editNameParts.firstName,
      editNameParts.lastName
    );

    if (nameErrors.firstName || nameErrors.lastName) {
      setError(nameErrors.firstName ?? nameErrors.lastName ?? "");
      return;
    }

    const payload = {
      id: editingClientId,
      name: buildClientName(editNameParts.firstName, editNameParts.lastName),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      source: editForm.source.trim() || "manual",
      status: editForm.status,
      preferredContactMethod: preferredContactSettings.enabled
        ? editForm.preferredContactMethod
        : "",
      preferredContactValue: preferredContactSettings.enabled
        ? editForm.preferredContactValue.trim()
        : "",
    };

    if (!payload.name) {
      setError(t.admin.clients.messages.nameRequired);
      return;
    }

    if (!payload.phone && !payload.email) {
      setError(t.admin.clients.messages.phoneOrEmailRequired);
      return;
    }

    const preferredContactErrors = validatePreferredContactFields(
      {
        preferredContactMethod: payload.preferredContactMethod ?? "",
        preferredContactValue: payload.preferredContactValue ?? "",
      },
      preferredContactSettings
    );

    if (
      preferredContactErrors.preferredContactMethod ||
      preferredContactErrors.preferredContactValue
    ) {
      setError(
        preferredContactErrors.preferredContactMethod ??
          preferredContactErrors.preferredContactValue ??
          ""
      );
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateClient(payload);
      await reloadClients();
      cancelEditing();
      setSuccessMessage("Клиент обновлён.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить клиента"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetView = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFavoriteFilter("all");
    setHighlightedClientId(null);
    navigate("/admin/clients");
  };

  const hasQuickViewState =
    highlightedClientId !== null || searchQuery.trim().length > 0;

  return (
    <main>
      <h1>{t.admin.clients.title}</h1>

      <ClientCreateForm
        form={form}
        lastName={lastName}
        isCreating={isCreating}
        showPreferredContact={preferredContactSettings.enabled}
        onChange={handleFormChange}
        onLastNameChange={setLastName}
        onSubmit={handleCreateClient}
        title={t.admin.clients.createForm.title}
        namePlaceholder="Имя"
        lastNamePlaceholder="Фамилия"
        phonePlaceholder={t.admin.clients.createForm.phonePlaceholder}
        emailPlaceholder={t.admin.clients.createForm.emailPlaceholder}
        sourcePlaceholder={t.admin.clients.createForm.sourcePlaceholder}
        submitLabel={t.admin.clients.createForm.submit}
        submittingLabel={t.admin.clients.createForm.submitting}
      />

      {editingClientId !== null ? (
        <div ref={editFormRef} className={styles.editFormAnchor}>
          <ClientEditForm
            form={editForm}
            isUpdating={isUpdating}
            showPreferredContact={preferredContactSettings.enabled}
            onChange={handleEditFormChange}
            onSubmit={handleUpdateClient}
            onCancel={cancelEditing}
            statusOptions={statusOptions}
          />
        </div>
      ) : null}

      <ClientsFilters
        allStatusesLabel={t.admin.clients.filters.allStatuses}
        searchPlaceholder={t.admin.clients.filters.searchPlaceholder}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        favoriteFilter={favoriteFilter}
        statusOptions={statusOptions}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onFavoriteChange={setFavoriteFilter}
      />

      {hasQuickViewState ? (
        <div className={styles.quickViewBanner}>
          <div className={styles.quickViewText}>
            <div className={styles.quickViewTitle}>
              Режим быстрого перехода
            </div>
            <div className={styles.quickViewList}>
              {highlightedClientId !== null ? (
                <span className={styles.quickViewChip}>Клиент</span>
              ) : null}
              {searchQuery.trim() ? (
                <span className={styles.quickViewChip}>
                  Поиск: {searchQuery.trim()}
                </span>
              ) : null}
            </div>
          </div>

          <div className={styles.quickViewActions}>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={handleResetView}
            >
              Показать всех клиентов
            </AdminButton>
          </div>
        </div>
      ) : null}

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {isLoading ? (
        <p>{t.admin.clients.messages.loading}</p>
      ) : items.length === 0 ? (
        <p>{t.admin.clients.messages.empty}</p>
      ) : (
        <ClientsTable
          items={items}
          createdLabel={t.admin.clients.table.created}
          nameLabel={t.admin.clients.table.name}
          phoneLabel={t.admin.clients.table.phone}
          emailLabel={t.admin.clients.table.email}
          sourceLabel={t.admin.clients.table.source}
          statusLabel={t.admin.clients.table.status}
          firstRequestLabel={t.admin.clients.table.firstRequest}
          statusLabels={t.admin.clients.statusLabels}
          sourceLabels={clientSourceLabels}
          favoriteUpdatingId={favoriteUpdatingId}
          highlightedClientId={highlightedClientId}
          onEdit={startEditing}
          onViewDetails={openClientDetails}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {selectedClient ? (
        <ClientDetailsModal
          client={selectedClient}
          sourceLabels={clientSourceLabels}
          statusLabels={t.admin.clients.statusLabels}
          onClose={closeClientDetails}
        />
      ) : null}
    </main>
  );
}