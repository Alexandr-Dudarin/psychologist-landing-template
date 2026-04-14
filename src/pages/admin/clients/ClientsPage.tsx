import { useEffect, useState } from "react";
import { useLanguage } from "../../../app/providers/LanguageProvider";
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
  const { t } = useLanguage();
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

      const clients = await getAdminClients({
        status: statusFilter,
        search: searchQuery,
      });

      setItems(clients);
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

  return (
    <main>
      <h1>{t.admin.clients.title}</h1>

      <section
        style={{
          marginTop: "20px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>{t.admin.clients.createForm.title}</h2>

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
            placeholder={t.admin.clients.createForm.namePlaceholder}
            style={inputStyle}
          />

          <input
            type="text"
            value={form.phone}
            onChange={(e) => handleFormChange("phone", e.target.value)}
            placeholder={t.admin.clients.createForm.phonePlaceholder}
            style={inputStyle}
          />

          <input
            type="email"
            value={form.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder={t.admin.clients.createForm.emailPlaceholder}
            style={inputStyle}
          />

          <input
            type="text"
            value={form.source}
            onChange={(e) => handleFormChange("source", e.target.value)}
            placeholder={t.admin.clients.createForm.sourcePlaceholder}
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
              {isCreating
                ? t.admin.clients.createForm.submitting
                : t.admin.clients.createForm.submit}
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
          <option value="all">{t.admin.clients.filters.allStatuses}</option>
          {clientStatuses.map((status) => (
            <option key={status} value={status}>
              {t.admin.clients.statusLabels[status]}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.admin.clients.filters.searchPlaceholder}
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
        <p>{t.admin.clients.messages.loading}</p>
      ) : items.length === 0 ? (
        <p>{t.admin.clients.messages.empty}</p>
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
                <th style={cellHeadStyle}>{t.admin.clients.table.created}</th>
                <th style={cellHeadStyle}>{t.admin.clients.table.name}</th>
                <th style={cellHeadStyle}>{t.admin.clients.table.phone}</th>
                <th style={cellHeadStyle}>{t.admin.clients.table.email}</th>
                <th style={cellHeadStyle}>{t.admin.clients.table.source}</th>
                <th style={cellHeadStyle}>{t.admin.clients.table.status}</th>
                <th style={cellHeadStyle}>{t.admin.clients.table.firstRequest}</th>
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
                  <td style={cellStyle}>{t.admin.clients.statusLabels[item.status]}</td>
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
