import { useEffect, useState } from "react";

import { useLanguage } from "../../../app/providers/LanguageProvider";
import { createClientFromRequest } from "../../../lib/api/adminClients";
import {
  getAdminRequests,
  updateAdminRequestStatus,
} from "../../../lib/api/adminRequests";
import type { CrmRequestRecord, RequestStatus } from "../../../types/request";
import { requestStatuses } from "../../../types/request";
import styles from "./RequestsPage.module.css";
import { RequestsFilters } from "./RequestsFilters";
import { RequestsTable } from "./RequestsTable";

export function RequestsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CrmRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creatingClientId, setCreatingClientId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const requests = await getAdminRequests({
          status: statusFilter,
          search: searchQuery,
        });

        if (isMounted) {
          setItems(requests);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t.admin.requests.messages.loadError
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

  const handleStatusChange = async (
    requestId: number,
    nextStatus: RequestStatus
  ) => {
    const previousItems = items;

    setItems((current) =>
      current.map((item) =>
        item.id === requestId ? { ...item, status: nextStatus } : item
      )
    );

    setSavingId(requestId);
    setError("");

    try {
      await updateAdminRequestStatus({
        id: requestId,
        status: nextStatus,
      });
    } catch (updateError) {
      setItems(previousItems);
      setError(
        updateError instanceof Error
          ? updateError.message
          : t.admin.requests.messages.updateStatusError
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateClient = async (requestId: number) => {
    setCreatingClientId(requestId);
    setError("");

    try {
      const result = await createClientFromRequest(requestId);

      setItems((current) =>
        current.map((item) =>
          item.id === requestId ? { ...item, clientId: result.item.id } : item
        )
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t.admin.requests.messages.createClientError
      );
    } finally {
      setCreatingClientId(null);
    }
  };

  const statusOptions = requestStatuses.map((status) => ({
    value: status,
    label: t.admin.requests.statusLabels[status],
  }));

  return (
    <main>
      <h1>{t.admin.requests.title}</h1>

      <RequestsFilters
        allStatusesLabel={t.admin.requests.filters.allStatuses}
        searchPlaceholder={t.admin.requests.filters.searchPlaceholder}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
      />

      {error ? <p className={styles.feedbackError}>{error}</p> : null}

      {isLoading ? (
        <p>{t.admin.requests.messages.loading}</p>
      ) : items.length === 0 ? (
        <p>{t.admin.requests.messages.empty}</p>
      ) : (
        <RequestsTable
          items={items}
          savingId={savingId}
          creatingClientId={creatingClientId}
          statusOptions={statusOptions}
          createdLabel={t.admin.requests.table.created}
          nameLabel={t.admin.requests.table.name}
          phoneLabel={t.admin.requests.table.phone}
          emailLabel={t.admin.requests.table.email}
          messageLabel={t.admin.requests.table.message}
          statusLabel={t.admin.requests.table.status}
          clientLabel={t.admin.requests.table.client}
          actionsSavingLabel={t.admin.requests.actions.saving}
          actionsCreateClientLabel={t.admin.requests.actions.createClient}
          actionsCreatingClientLabel={t.admin.requests.actions.creatingClient}
          actionsCreatedLabel={t.admin.requests.actions.created}
          onStatusChange={handleStatusChange}
          onCreateClient={handleCreateClient}
        />
      )}
    </main>
  );
}
