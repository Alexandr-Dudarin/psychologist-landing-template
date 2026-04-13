import { useEffect, useState } from "react";
import {
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
} from "../../../lib/api/adminServices";
import type {
  CrmServiceRecord,
  CreateServicePayload,
  UpdateServicePayload,
} from "../../../types/service";

type ServiceForm = {
  title: string;
  description: string;
  price: string;
  durationMinutes: string;
  isActive: boolean;
};

const initialCreateForm: ServiceForm = {
  title: "",
  description: "",
  price: "",
  durationMinutes: "60",
  isActive: true,
};

const initialEditForm: ServiceForm = {
  title: "",
  description: "",
  price: "",
  durationMinutes: "60",
  isActive: true,
};

export function ServicesPage() {
  const [items, setItems] = useState<CrmServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activityFilter, setActivityFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<ServiceForm>(initialCreateForm);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ServiceForm>(initialEditForm);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const services = await getAdminServices({
          activity: activityFilter,
          search: searchQuery,
        });

        if (isMounted) {
          setItems(services);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить услуги"
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
  }, [activityFilter, searchQuery]);

  const handleCreateFormChange = (
    field: keyof ServiceForm,
    value: string | boolean
  ) => {
    setCreateForm((prev) => ({
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

  const handleEditFormChange = (
    field: keyof ServiceForm,
    value: string | boolean
  ) => {
    setEditForm((prev) => ({
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

  const reloadServices = async () => {
    const services = await getAdminServices({
      activity: activityFilter,
      search: searchQuery,
    });

    setItems(services);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateServicePayload = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      price: Number(createForm.price),
      durationMinutes: Number(createForm.durationMinutes),
      isActive: createForm.isActive,
    };

    if (!payload.title) {
      setError("Название услуги обязательно.");
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setError("Укажите корректную цену.");
      return;
    }

    if (
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0
    ) {
      setError("Укажите корректную длительность в минутах.");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      await createAdminService(payload);
      await reloadServices();
      setCreateForm(initialCreateForm);
      setSuccessMessage("Услуга создана.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Не удалось создать услугу"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (service: CrmServiceRecord) => {
    setEditingServiceId(service.id);
    setEditForm({
      title: service.title,
      description: service.description,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      isActive: service.isActive,
    });
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setEditForm(initialEditForm);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingServiceId === null) {
      return;
    }

    const payload: UpdateServicePayload = {
      id: editingServiceId,
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      price: Number(editForm.price),
      durationMinutes: Number(editForm.durationMinutes),
      isActive: editForm.isActive,
    };

    if (!payload.title) {
      setError("Название услуги обязательно.");
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setError("Укажите корректную цену.");
      return;
    }

    if (
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0
    ) {
      setError("Укажите корректную длительность в минутах.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateAdminService(payload);
      await reloadServices();
      setSuccessMessage("Услуга обновлена.");
      cancelEditing();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить услугу"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    const confirmed = window.confirm(
      "Удалить услугу? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteAdminService(id);
      await reloadServices();

      if (editingServiceId === id) {
        cancelEditing();
      }

      setSuccessMessage("Услуга удалена.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить услугу"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main>
      <h1>Услуги</h1>

      <section
        style={{
          marginTop: "20px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Создать услугу</h2>

        <form
          onSubmit={handleCreateService}
          style={{
            display: "grid",
            gap: "12px",
            maxWidth: "720px",
          }}
        >
          <input
            type="text"
            value={createForm.title}
            onChange={(e) => handleCreateFormChange("title", e.target.value)}
            placeholder="Название услуги"
            style={inputStyle}
          />

          <textarea
            value={createForm.description}
            onChange={(e) =>
              handleCreateFormChange("description", e.target.value)
            }
            placeholder="Описание услуги"
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={createForm.price}
            onChange={(e) => handleCreateFormChange("price", e.target.value)}
            placeholder="Цена"
            style={inputStyle}
          />

          <input
            type="number"
            min="1"
            step="1"
            value={createForm.durationMinutes}
            onChange={(e) =>
              handleCreateFormChange("durationMinutes", e.target.value)
            }
            placeholder="Длительность в минутах"
            style={inputStyle}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={createForm.isActive}
              onChange={(e) =>
                handleCreateFormChange("isActive", e.target.checked)
              }
            />
            <span>Услуга активна</span>
          </label>

          <div>
            <button
              type="submit"
              disabled={isCreating}
              style={buttonStyle}
            >
              {isCreating ? "Создание..." : "Создать услугу"}
            </button>
          </div>
        </form>
      </section>

      {editingServiceId !== null && (
        <section
          style={{
            marginTop: "20px",
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Редактировать услугу</h2>

          <form
            onSubmit={handleUpdateService}
            style={{
              display: "grid",
              gap: "12px",
              maxWidth: "720px",
            }}
          >
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => handleEditFormChange("title", e.target.value)}
              placeholder="Название услуги"
              style={inputStyle}
            />

            <textarea
              value={editForm.description}
              onChange={(e) =>
                handleEditFormChange("description", e.target.value)
              }
              placeholder="Описание услуги"
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.price}
              onChange={(e) => handleEditFormChange("price", e.target.value)}
              placeholder="Цена"
              style={inputStyle}
            />

            <input
              type="number"
              min="1"
              step="1"
              value={editForm.durationMinutes}
              onChange={(e) =>
                handleEditFormChange("durationMinutes", e.target.value)
              }
              placeholder="Длительность в минутах"
              style={inputStyle}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) =>
                  handleEditFormChange("isActive", e.target.checked)
                }
              />
              <span>Услуга активна</span>
            </label>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={isUpdating}
                style={buttonStyle}
              >
                {isUpdating ? "Сохранение..." : "Сохранить изменения"}
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                style={buttonStyle}
              >
                Отменить
              </button>
            </div>
          </form>
        </section>
      )}

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
          value={activityFilter}
          onChange={(e) =>
            setActivityFilter(e.target.value as "all" | "active" | "inactive")
          }
          style={{
            minWidth: "180px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        >
          <option value="all">все услуги</option>
          <option value="active">только активные</option>
          <option value="inactive">только неактивные</option>
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию или описанию"
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
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Услуг пока нет.</p>
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
                <th style={cellHeadStyle}>Создана</th>
                <th style={cellHeadStyle}>Название</th>
                <th style={cellHeadStyle}>Цена</th>
                <th style={cellHeadStyle}>Длительность</th>
                <th style={cellHeadStyle}>Активна</th>
                <th style={cellHeadStyle}>Описание</th>
                <th style={cellHeadStyle}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td style={cellStyle}>{item.title}</td>
                  <td style={cellStyle}>{item.price}</td>
                  <td style={cellStyle}>{item.durationMinutes} мин</td>
                  <td style={cellStyle}>{item.isActive ? "Да" : "Нет"}</td>
                  <td style={cellStyle}>{item.description || "-"}</td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        style={smallButtonStyle}
                      >
                        Редактировать
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteService(item.id)}
                        disabled={deletingId === item.id}
                        style={smallButtonStyle}
                      >
                        {deletingId === item.id ? "Удаление..." : "Удалить"}
                      </button>
                    </div>
                  </td>
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

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
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