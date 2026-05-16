import { useEffect, useMemo, useState, type FormEvent } from "react";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { siteSettings } from "../../../data/siteSettings";
import {
  createAdminService,
  createAdminServicePackagePlan,
  deleteAdminService,
  deleteAdminServicePackagePlan,
  getAdminServicePackagePlans,
  getAdminServices,
  updateAdminService,
  updateAdminServicePackagePlan,
} from "../../../lib/api/adminServices";
import type {
  CreateServicePackagePlanPayload,
  CreateServicePayload,
  CrmServicePackagePlanRecord,
  CrmServiceRecord,
  UpdateServicePackagePlanPayload,
  UpdateServicePayload,
} from "../../../types/service";
import { ServiceCreateForm } from "./ServiceCreateForm";
import { ServiceEditForm } from "./ServiceEditForm";
import { ServicePackagePlanCreateForm } from "./ServicePackagePlanCreateForm";
import { ServicePackagePlanEditForm } from "./ServicePackagePlanEditForm";
import { ServicePackagePlansTable } from "./ServicePackagePlansTable";
import {
  initialCreateForm,
  initialEditForm,
  type ServiceForm,
} from "./serviceForm";
import {
  initialPackagePlanCreateForm,
  initialPackagePlanEditForm,
  mapPackagePlanToForm,
  type ServicePackagePlanForm,
} from "./servicePackagePlanForm";
import styles from "./ServicesPage.module.css";
import { ServicesTable } from "./ServicesTable";

function validateServicePayload(
  payload: CreateServicePayload | UpdateServicePayload
): string | null {
  if (!payload.title) {
    return "Название услуги обязательно.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену.";
  }

  if (
    !Number.isInteger(payload.durationMinutes) ||
    payload.durationMinutes <= 0
  ) {
    return "Укажите корректную длительность в минутах.";
  }

  return null;
}

function validatePackagePlanPayload(
  payload: CreateServicePackagePlanPayload | UpdateServicePackagePlanPayload
): string | null {
  if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
    return "Выберите базовую услугу для пакета.";
  }

  if (!payload.title) {
    return "Название пакета обязательно.";
  }

  if (!Number.isInteger(payload.sessionsCount) || payload.sessionsCount <= 0) {
    return "Укажите корректное количество сессий в пакете.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену пакета.";
  }

  return null;
}

export function ServicesPage() {
  const servicePackagesEnabled = siteSettings.servicePackages.enabled;

  const [items, setItems] = useState<CrmServiceRecord[]>([]);
  const [packagePlans, setPackagePlans] = useState<
    CrmServicePackagePlanRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPackagePlansLoading, setIsPackagePlansLoading] = useState(
    servicePackagesEnabled
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isPackagePlanCreating, setIsPackagePlanCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPackagePlanUpdating, setIsPackagePlanUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingPackagePlanId, setDeletingPackagePlanId] = useState<
    number | null
  >(null);
  const [hidingId, setHidingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activityFilter, setActivityFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState<ServiceForm>(initialCreateForm);
  const [packagePlanCreateForm, setPackagePlanCreateForm] =
    useState<ServicePackagePlanForm>(initialPackagePlanCreateForm);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingPackagePlanId, setEditingPackagePlanId] = useState<
    number | null
  >(null);
  const [editForm, setEditForm] = useState<ServiceForm>(initialEditForm);
  const [packagePlanEditForm, setPackagePlanEditForm] =
    useState<ServicePackagePlanForm>(initialPackagePlanEditForm);

  const activeServices = useMemo(
    () => items.filter((service) => service.isActive),
    [items]
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setIsPackagePlansLoading(servicePackagesEnabled);
          setError("");
        }

        const [services, servicePackagePlans] = await Promise.all([
          getAdminServices({
            activity: activityFilter,
            search: searchQuery,
          }),
          servicePackagesEnabled
            ? getAdminServicePackagePlans()
            : Promise.resolve([]),
        ]);

        if (isMounted) {
          setItems(services);
          setPackagePlans(servicePackagePlans);
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
          setIsPackagePlansLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [activityFilter, searchQuery, servicePackagesEnabled]);

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

  const handlePackagePlanCreateFormChange = (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => {
    setPackagePlanCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetMessages();
  };

  const handlePackagePlanEditFormChange = (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => {
    setPackagePlanEditForm((prev) => ({
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

  const reloadPackagePlans = async () => {
    if (!servicePackagesEnabled) {
      setPackagePlans([]);
      return;
    }

    const servicePackagePlans = await getAdminServicePackagePlans();

    setPackagePlans(servicePackagePlans);
  };

  const reloadAllServiceData = async () => {
    const [services, servicePackagePlans] = await Promise.all([
      getAdminServices({
        activity: activityFilter,
        search: searchQuery,
      }),
      servicePackagesEnabled
        ? getAdminServicePackagePlans()
        : Promise.resolve([]),
    ]);

    setItems(services);
    setPackagePlans(servicePackagePlans);
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

    const validationError = validateServicePayload(payload);

    if (validationError) {
      setError(validationError);
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

  const handleCreatePackagePlan = async (event: FormEvent) => {
    event.preventDefault();

    if (!servicePackagesEnabled) {
      return;
    }

    const payload: CreateServicePackagePlanPayload = {
      serviceId: Number(packagePlanCreateForm.serviceId),
      title: packagePlanCreateForm.title.trim(),
      description: packagePlanCreateForm.description.trim(),
      sessionsCount: Number(packagePlanCreateForm.sessionsCount),
      price: Number(packagePlanCreateForm.price),
      isActive: packagePlanCreateForm.isActive,
    };

    const validationError = validatePackagePlanPayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPackagePlanCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      await createAdminServicePackagePlan(payload);
      await reloadPackagePlans();
      setPackagePlanCreateForm(initialPackagePlanCreateForm);
      setSuccessMessage("Пакет услуг создан.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Не удалось создать пакет услуг"
      );
    } finally {
      setIsPackagePlanCreating(false);
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

  const startEditingPackagePlan = (
    packagePlan: CrmServicePackagePlanRecord
  ) => {
    setEditingPackagePlanId(packagePlan.id);
    setPackagePlanEditForm(mapPackagePlanToForm(packagePlan));
    setError("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setEditForm(initialEditForm);
  };

  const cancelPackagePlanEditing = () => {
    setEditingPackagePlanId(null);
    setPackagePlanEditForm(initialPackagePlanEditForm);
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

    const validationError = validateServicePayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateAdminService(payload);
      await reloadAllServiceData();
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

  const handleUpdatePackagePlan = async (event: FormEvent) => {
    event.preventDefault();

    if (!servicePackagesEnabled || editingPackagePlanId === null) {
      return;
    }

    const payload: UpdateServicePackagePlanPayload = {
      id: editingPackagePlanId,
      serviceId: Number(packagePlanEditForm.serviceId),
      title: packagePlanEditForm.title.trim(),
      description: packagePlanEditForm.description.trim(),
      sessionsCount: Number(packagePlanEditForm.sessionsCount),
      price: Number(packagePlanEditForm.price),
      isActive: packagePlanEditForm.isActive,
    };

    const validationError = validatePackagePlanPayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPackagePlanUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateAdminServicePackagePlan(payload);
      await reloadPackagePlans();
      setSuccessMessage("Пакет услуг обновлён.");
      cancelPackagePlanEditing();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить пакет услуг"
      );
    } finally {
      setIsPackagePlanUpdating(false);
    }
  };

  const handleHideService = async (service: CrmServiceRecord) => {
    if (!service.isActive) {
      return;
    }

    const confirmed = window.confirm(
      "Скрыть услугу из онлайн-записи? Старые записи и история по этой услуге сохранятся."
    );

    if (!confirmed) {
      return;
    }

    setHidingId(service.id);
    setError("");
    setSuccessMessage("");

    try {
      await updateAdminService({
        id: service.id,
        title: service.title,
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes,
        isActive: false,
      });

      await reloadAllServiceData();

      if (editingServiceId === service.id) {
        setEditForm((prev) => ({
          ...prev,
          isActive: false,
        }));
      }

      setSuccessMessage("Услуга скрыта из онлайн-записи.");
    } catch (hideError) {
      setError(
        hideError instanceof Error
          ? hideError.message
          : "Не удалось скрыть услугу из записи"
      );
    } finally {
      setHidingId(null);
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
      await reloadAllServiceData();

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

  const handleDeletePackagePlan = async (id: number) => {
    if (!servicePackagesEnabled) {
      return;
    }

    const confirmed = window.confirm(
      "Удалить пакет услуг? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingPackagePlanId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteAdminServicePackagePlan(id);
      await reloadPackagePlans();

      if (editingPackagePlanId === id) {
        cancelPackagePlanEditing();
      }

      setSuccessMessage("Пакет услуг удалён.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить пакет услуг"
      );
    } finally {
      setDeletingPackagePlanId(null);
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

      <AdminFiltersRow>
        <select
          value={activityFilter}
          onChange={(event) => {
            setActivityFilter(
              event.target.value as "all" | "active" | "inactive"
            );
            resetMessages();
          }}
          className={`${styles.input} ${styles.filterSelect}`}
        >
          <option value="all">все услуги</option>
          <option value="active">только активные</option>
          <option value="inactive">только неактивные</option>
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            resetMessages();
          }}
          placeholder="Поиск по названию или описанию"
          className={`${styles.input} ${styles.searchInput}`}
        />
      </AdminFiltersRow>

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {isLoading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Услуг пока нет.</p>
      ) : (
        <ServicesTable
          items={items}
          deletingId={deletingId}
          hidingId={hidingId}
          onEdit={startEditing}
          onDelete={handleDeleteService}
          onHide={handleHideService}
        />
      )}

      {servicePackagesEnabled ? (
        <>
          <div className={styles.packagePlansHeader}>
            <h2 className={styles.packagePlansTitle}>Пакеты услуг</h2>
            <p className={styles.packagePlansDescription}>
              Здесь можно создать пакеты на основе обычных услуг: например 4, 8
              или 12 разовых сессий по отдельной цене.
            </p>
          </div>

          <ServicePackagePlanCreateForm
            form={packagePlanCreateForm}
            isCreating={isPackagePlanCreating}
            services={activeServices}
            onChange={handlePackagePlanCreateFormChange}
            onSubmit={handleCreatePackagePlan}
          />

          {editingPackagePlanId !== null ? (
            <ServicePackagePlanEditForm
              form={packagePlanEditForm}
              isUpdating={isPackagePlanUpdating}
              services={items}
              onCancel={cancelPackagePlanEditing}
              onChange={handlePackagePlanEditFormChange}
              onSubmit={handleUpdatePackagePlan}
            />
          ) : null}

          {isPackagePlansLoading ? (
            <p>Загрузка пакетов...</p>
          ) : packagePlans.length === 0 ? (
            <p className={styles.empty}>Пакетов услуг пока нет.</p>
          ) : (
            <ServicePackagePlansTable
              items={packagePlans}
              deletingId={deletingPackagePlanId}
              onEdit={startEditingPackagePlan}
              onDelete={handleDeletePackagePlan}
            />
          )}
        </>
      ) : null}
    </main>
  );
}