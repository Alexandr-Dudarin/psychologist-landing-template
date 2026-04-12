import { useEffect, useState } from "react";
import {
  getAdminRequests,
  updateAdminRequestStatus,
} from "../../../lib/api/adminRequests";
import { createClientFromRequest } from "../../../lib/api/adminClients";
import type { CrmRequestRecord, RequestStatus } from "../../../types/request";
import { requestStatuses } from "../../../types/request";

export function RequestsPage() {
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
              : "Failed to load requests"
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
          : "Failed to update request status"
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
          : "Failed to create client"
      );
    } finally {
      setCreatingClientId(null);
    }
  };

  return (
    <main>
      <h1>Requests</h1>

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
          <option value="all">all statuses</option>
          {requestStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, email, message"
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
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No requests found.</p>
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
                <th style={cellHeadStyle}>Created</th>
                <th style={cellHeadStyle}>Name</th>
                <th style={cellHeadStyle}>Phone</th>
                <th style={cellHeadStyle}>Email</th>
                <th style={cellHeadStyle}>Message</th>
                <th style={cellHeadStyle}>Status</th>
                <th style={cellHeadStyle}>Client</th>
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
                            {status}
                          </option>
                        ))}
                      </select>
                      {savingId === item.id && (
                        <div style={{ marginTop: "6px", fontSize: "12px" }}>
                          Saving...
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
                          ? "Created"
                          : creatingClientId === item.id
                            ? "Creating..."
                            : "Create client"}
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