import { useEffect, useState } from "react";
import {
  getAdminClients,
  createManualClient,
} from "../../../lib/api/adminClients";
import type {
  CrmClientRecord,
  ClientStatus,
  CreateManualClientPayload,
} from "../../../types/client";
import { clientStatuses } from "../../../types/client";

type ManualClientForm = {
  name: string;
  phone: string;
  email: string;
  source: string;
};

const initialForm: ManualClientForm = {
  name: "",
  phone: "",
  email: "",
  source: "manual",
};

export function ClientsPage() {
  const [items, setItems] = useState<CrmClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ManualClientForm>(initialForm);

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
              : "Failed to load clients"
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

  const handleFormChange = (
    field: keyof ManualClientForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateManualClientPayload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source.trim() || "manual",
    };

    if (!payload.name) {
      setError("Client name is required.");
      return;
    }

    if (!payload.phone && !payload.email) {
      setError("At least phone or email is required.");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      await createManualClient(payload);

      const clients = await getAdminClients({
        status: statusFilter,
        search: searchQuery,
      });

      setItems(clients);
      setForm(initialForm);
      setSuccessMessage("Client created successfully.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create client"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main>
      <h1>Clients</h1>

      <section
        style={{
          marginTop: "20px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create client manually</h2>

        <form
          onSubmit={handleCreateClient}
          style={{
            display: "grid",
            gap: "12px",
            maxWidth: "640px",
          }}
        >
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            placeholder="Client name"
            style={inputStyle}
          />

          <input
            type="text"
            value={form.phone}
            onChange={(e) => handleFormChange("phone", e.target.value)}
            placeholder="Phone"
            style={inputStyle}
          />

          <input
            type="email"
            value={form.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="Email"
            style={inputStyle}
          />

          <input
            type="text"
            value={form.source}
            onChange={(e) => handleFormChange("source", e.target.value)}
            placeholder="Source"
            style={inputStyle}
          />

          <div>
            <button
              type="submit"
              disabled={isCreating}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              {isCreating ? "Creating..." : "Create client"}
            </button>
          </div>
        </form>
      </section>

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
            setStatusFilter(e.target.value as ClientStatus | "all")
          }
          style={{
            minWidth: "180px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        >
          <option value="all">all statuses</option>
          {clientStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, email"
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
      {successMessage && <p style={{ color: "#2e8b57" }}>{successMessage}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No clients found.</p>
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
                <th style={cellHeadStyle}>Source</th>
                <th style={cellHeadStyle}>Status</th>
                <th style={cellHeadStyle}>First request</th>
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
                  <td style={cellStyle}>{item.phone || "-"}</td>
                  <td style={cellStyle}>{item.email || "-"}</td>
                  <td style={cellStyle}>{item.source}</td>
                  <td style={cellStyle}>{item.status}</td>
                  <td style={cellStyle}>{item.firstRequestId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

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