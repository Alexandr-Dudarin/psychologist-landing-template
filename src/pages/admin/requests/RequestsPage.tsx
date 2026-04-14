import { useEffect, useState } from "react";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import {
  getAdminRequests,
  updateAdminRequestStatus,
} from "../../../lib/api/adminRequests";
import { createClientFromRequest } from "../../../lib/api/adminClients";
import type { CrmRequestRecord, RequestStatus } from "../../../types/request";
import { requestStatuses } from "../../../types/request";

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
          item.id === requestId
            ? { ...item, clientId: result.item.id }
            : item
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

  return (
    <main>
      <h1>{t.admin.requests.title}</h1>

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
          onChange={(e) =>
            setStatusFilter(e.target.value as RequestStatus | "all")
          }
          style={{
            minWidth: "180px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        >
          <option value="all">{t.admin.requests.filters.allStatuses}</option>
          {requestStatuses.map((status) => (
            <option key={status} value={status}>
              {t.admin.requests.statusLabels[status]}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.admin.requests.filters.searchPlaceholder}
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

      {error && <p style={{ color: "#d96b6b" }}>{error}</p>}

      {isLoading ? (
        <p>{t.admin.requests.messages.loading}</p>
      ) : items.length === 0 ? (
        <p>{t.admin.requests.messages.empty}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr>
                <th style={cellHeadStyle}>ID</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.created}</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.name}</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.phone}</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.email}</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.message}</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.status}</th>
                <th style={cellHeadStyle}>{t.admin.requests.table.client}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const clientAlreadyCreated = item.clientId !== null;

                return (
                  <tr key={item.id}>
                    <td style={cellStyle}>{item.id}</td>
                    <td style={cellStyle}>
                      {new Date(item.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td style={cellStyle}>{item.name}</td>
                    <td style={cellStyle}>{item.phone}</td>
                    <td style={cellStyle}>{item.email}</td>
                    <td style={cellStyle}>{item.message || "-"}</td>
                    <td style={cellStyle}>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(
                            item.id,
                            e.target.value as RequestStatus
                          )
                        }
                        disabled={savingId === item.id}
                        style={{
                          minWidth: "140px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        {requestStatuses.map((status) => (
                          <option key={status} value={status}>
                            {t.admin.requests.statusLabels[status]}
                          </option>
                        ))}
                      </select>
                      {savingId === item.id && (
                        <div style={{ marginTop: "6px", fontSize: "12px" }}>
                          {t.admin.requests.actions.saving}
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <button
                        type="button"
                        onClick={() => handleCreateClient(item.id)}
                        disabled={creatingClientId === item.id || clientAlreadyCreated}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          cursor: "pointer",
                          background: clientAlreadyCreated ? "#f5f5f5" : "#fff",
                        }}
                      >
                        {clientAlreadyCreated
                          ? t.admin.requests.actions.created
                          : creatingClientId === item.id
                            ? t.admin.requests.actions.creatingClient
                            : t.admin.requests.actions.createClient}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const cellHeadStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontWeight: 700,
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};
