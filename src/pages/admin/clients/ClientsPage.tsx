import { useEffect, useState, type FormEvent } from "react";

import { useLanguage } from "../../../app/providers/LanguageProvider";
import {
  createManualClient,
  getAdminClients,
  updateClient,
} from "../../../lib/api/adminClients";
import type {
  ClientStatus,
  CreateManualClientPayload,
  CrmClientRecord,
  UpdateClientPayload,
} from "../../../types/client";
import { clientStatuses } from "../../../types/client";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { ClientCreateForm } from "./ClientCreateForm";
import { ClientEditForm } from "./ClientEditForm";
import { ClientsFilters } from "./ClientsFilters";
import { ClientsTable } from "./ClientsTable";
import {
  initialForm,
  mapClientToForm,
  type ClientForm,
} from "./clientForm";

const clientSourceLabels: Record<string, string> = {
  manual: "Вручную",
  website: "Сайт",
};

export function ClientsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CrmClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClientForm>(initialForm);

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
  }, [statusFilter, searchQuery]);

  const resetMessages = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleFormChange = (field: keyof ClientForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetMessages();
  };

  const handleEditFormChange = (field: keyof ClientForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value as ClientForm[typeof field],
    }));
    resetMessages();
  };

  const reloadClients = async () => {
    const clients = await getAdminClients({
      status: statusFilter,
      search: searchQuery,
    });

    setItems(clients);
  };

  const handleCreateClient = async (event: FormEvent) => {
    event.preventDefault();

    const payload: CreateManualClientPayload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source.trim() || "manual",
    };

    if (!payload.name) {
      setError(t.admin.clients.messages.nameRequired);
      return;
    }

    if (!payload.phone && !payload.email) {
      setError(t.admin.clients.messages.phoneOrEmailRequired);
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await createManualClient(payload);
      await reloadClients();
      setForm(initialForm);
      setSuccessMessage(
        result.alreadyExisted
          ? "Клиент с таким телефоном или email уже существует. Использован существующий клиент."
          : t.admin.clients.messages.createSuccess
      );
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
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingClientId(null);
    setEditForm(initialForm);
  };

  const validateUpdatePayload = (
    payload: UpdateClientPayload
  ): string | null => {
    if (!Number.isInteger(payload.id) || payload.id <= 0) {
      return "Некорректный клиент.";
    }

    if (!payload.name.trim()) {
      return "Укажите имя клиента.";
    }

    if (!payload.phone.trim() && !payload.email.trim()) {
      return "Укажите телефон или email клиента.";
    }

    return null;
  };

  const handleUpdateClient = async (event: FormEvent) => {
    event.preventDefault();

    if (editingClientId === null) {
      return;
    }

    const payload: UpdateClientPayload = {
      id: editingClientId,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      source: editForm.source.trim() || "manual",
      status: editForm.status,
    };

    const validationError = validateUpdatePayload(payload);

    if (validationError) {
      setError(validationError);
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

  return (
    <main>
      <h1>{t.admin.clients.title}</h1>

      <ClientCreateForm
        form={form}
        isCreating={isCreating}
        onChange={handleFormChange}
        onSubmit={handleCreateClient}
        title={t.admin.clients.createForm.title}
        namePlaceholder={t.admin.clients.createForm.namePlaceholder}
        phonePlaceholder={t.admin.clients.createForm.phonePlaceholder}
        emailPlaceholder={t.admin.clients.createForm.emailPlaceholder}
        sourcePlaceholder={t.admin.clients.createForm.sourcePlaceholder}
        submitLabel={t.admin.clients.createForm.submit}
        submittingLabel={t.admin.clients.createForm.submitting}
      />

      {editingClientId !== null && (
        <ClientEditForm
          form={editForm}
          isUpdating={isUpdating}
          onChange={handleEditFormChange}
          onSubmit={handleUpdateClient}
          onCancel={cancelEditing}
          statusOptions={clientStatuses.map((status) => ({
            value: status,
            label: t.admin.clients.statusLabels[status],
          }))}
        />
      )}

      <ClientsFilters
        allStatusesLabel={t.admin.clients.filters.allStatuses}
        searchPlaceholder={t.admin.clients.filters.searchPlaceholder}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        statusOptions={clientStatuses.map((status) => ({
          value: status,
          label: t.admin.clients.statusLabels[status],
        }))}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
      />

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
          onEdit={startEditing}
        />
      )}
    </main>
  );
}