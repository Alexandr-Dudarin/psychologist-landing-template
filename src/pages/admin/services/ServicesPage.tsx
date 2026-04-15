import { useEffect, useState, type FormEvent } from "react";

import {
  createAdminService,
  deleteAdminService,
  getAdminServices,
  updateAdminService,
} from "../../../lib/api/adminServices";
import type {
  CrmServiceRecord,
  CreateServicePayload,
  UpdateServicePayload,
} from "../../../types/service";
import { ServiceCreateForm } from "./ServiceCreateForm";
import { ServiceEditForm } from "./ServiceEditForm";
import styles from "./ServicesPage.module.css";
import { ServicesTable } from "./ServicesTable";
import {
  initialCreateForm,
  initialEditForm,
  type ServiceForm,
} from "./serviceForm";

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

  const resetMessages = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleCreateFormChange = (
    field: keyof ServiceForm,
    value: string | boolean
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetMessages();
  };

  const handleEditFormChange = (
    field: keyof ServiceForm,
    value: string | boolean
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetMessages();
  };

  const reloadServices = async () => {
    const services = await getAdminServices({
      activity: activityFilter,
      search: searchQuery,
    });

    setItems(services);
  };

  const handleCreateService = async (event: FormEvent) => {
    event.preventDefault();

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

  const handleUpdateService = async (event: FormEvent) => {
    event.preventDefault();

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

      <ServiceCreateForm
        form={createForm}
        isCreating={isCreating}
        onChange={handleCreateFormChange}
        onSubmit={handleCreateService}
      />

      {editingServiceId !== null ? (
        <ServiceEditForm
          form={editForm}
          isUpdating={isUpdating}
          onCancel={cancelEditing}
          onChange={handleEditFormChange}
          onSubmit={handleUpdateService}
        />
      ) : null}

      <div className={styles.filters}>
        <select
          value={activityFilter}
          onChange={(event) =>
            setActivityFilter(event.target.value as "all" | "active" | "inactive")
          }
          className={`${styles.input} ${styles.filterSelect}`}
        >
          <option value="all">все услуги</option>
          <option value="active">только активные</option>
          <option value="inactive">только неактивные</option>
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Поиск по названию или описанию"
          className={`${styles.input} ${styles.searchInput}`}
        />
      </div>

      {error ? <p className={styles.feedbackError}>{error}</p> : null}
      {successMessage ? (
        <p className={styles.feedbackSuccess}>{successMessage}</p>
      ) : null}

      {isLoading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Услуг пока нет.</p>
      ) : (
        <ServicesTable
          items={items}
          deletingId={deletingId}
          onEdit={startEditing}
          onDelete={handleDeleteService}
        />
      )}
    </main>
  );
}
