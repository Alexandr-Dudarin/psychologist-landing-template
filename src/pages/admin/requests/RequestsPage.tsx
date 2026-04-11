import { useEffect, useState } from "react";
import { getAdminRequests } from "../../../lib/api/adminRequests";
import type { CrmRequestRecord } from "../../../types/request";

export function RequestsPage() {
  const [items, setItems] = useState<CrmRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setError("");
        const requests = await getAdminRequests();

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
  }, []);

  if (isLoading) {
    return (
      <main>
        <h1>Requests</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Requests</h1>
        <p style={{ color: "#d96b6b" }}>{error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Requests</h1>

      {items.length === 0 ? (
        <p>No requests yet.</p>
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
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td style={cellStyle}>{item.name}</td>
                  <td style={cellStyle}>{item.phone}</td>
                  <td style={cellStyle}>{item.email}</td>
                  <td style={cellStyle}>{item.message || "-"}</td>
                  <td style={cellStyle}>{item.status}</td>
                </tr>
              ))}
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