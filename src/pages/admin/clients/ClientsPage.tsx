import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useLanguage } from "../../../app/providers/LanguageProvider";
import {
  createManualClient,
  getAdminClients,
} from "../../../lib/api/adminClients";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import type {
  ClientStatus,
  CreateManualClientPayload,
  CrmClientRecord,
} from "../../../types/client";
import { clientStatuses } from "../../../types/client";
import { ClientCreateForm } from "./ClientCreateForm";
import { ClientsFilters } from "./ClientsFilters";
import { ClientsTable } from "./ClientsTable";
import { initialForm, type ManualClientForm } from "./clientForm";
import styles from "./ClientsPage.module.css";

const clientSourceLabels: Record<string, string> = {
  manual: "\u0412\u0440\u0443\u0447\u043d\u0443\u044e",
  website: "\u0421\u0430\u0439\u0442",
};

export function ClientsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CrmClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedClientId, setHighlightedClientId] = useState<number | null>(
    null
  );
  const [form, setForm] = useState<ManualClientForm>(initialForm);

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

  const handleFormChange = (field: keyof ManualClientForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
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
      await createManualClient(payload);
      await reloadClients();
      setForm(initialForm);
      setSuccessMessage(t.admin.clients.messages.createSuccess);
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

  const handleResetView = () => {
    setSearchQuery("");
    setStatusFilter("all");
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

      {hasQuickViewState ? (
        <div className={styles.quickViewBanner}>
          <div className={styles.quickViewText}>
            <div className={styles.quickViewTitle}>
              {"\u0420\u0435\u0436\u0438\u043c\u0020\u0431\u044b\u0441\u0442\u0440\u043e\u0433\u043e\u0020\u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0430"}
            </div>
            <div className={styles.quickViewList}>
              {highlightedClientId !== null ? (
                <span className={styles.quickViewChip}>
                  {"\u041a\u043b\u0438\u0435\u043d\u0442"} #{highlightedClientId}
                </span>
              ) : null}
              {searchQuery.trim() ? (
                <span className={styles.quickViewChip}>
                  {"\u041f\u043e\u0438\u0441\u043a\u003a"} {searchQuery.trim()}
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
              {"\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c\u0020\u0432\u0441\u0435\u0445\u0020\u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432"}
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
          highlightedClientId={highlightedClientId}
        />
      )}
    </main>
  );
}
