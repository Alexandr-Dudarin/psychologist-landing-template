import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { AdminRefreshableTableArea } from "../../../components/admin/AdminRefreshableTableArea";
import {
  createAdminService,
  createAdminServicePackagePlan,
  deleteAdminService,
  deleteAdminServicePackagePlan,
  getAdminServicePackagePlans,
  getAdminServices,
  hideAdminServicePackagePlan,
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
  const [items, setItems] = useState<CrmServiceRecord[]>([]);
  const [packagePlans, setPackagePlans] = useState<
    CrmServicePackagePlanRecord[]
  >([]);
  const [lastVisibleItems, setLastVisibleItems] = useState<CrmServiceRecord[]>(
    []
  );
  const [lastVisiblePackagePlans, setLastVisiblePackagePlans] = useState<
    CrmServicePackagePlanRecord[]
  >([]);
  const [hasLoadedServicesOnce, setHasLoadedServicesOnce] = useState(false);
  const [hasLoadedPackagePlansOnce, setHasLoadedPackagePlansOnce] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPackagePlansLoading, setIsPackagePlansLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isPackagePlanCreating, setIsPackagePlanCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPackagePlanUpdating, setIsPackagePlanUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingPackagePlanId, setDeletingPackagePlanId] = useState<
    number | null
  >(null);
  const [hidingId, setHidingId] = useState<number | null>(null);
  const [hidingPackagePlanId, setHidingPackagePlanId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [packageError, setPackageError] = useState("");
  const [packageSuccessMessage, setPackageSuccessMessage] = useState("");
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

  const editServiceFormRef = useRef<HTMLDivElement | null>(null);
  const editPackagePlanFormRef = useRef<HTMLDivElement | null>(null);

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
          setIsPackagePlansLoading(true);
          setError("");
          setPackageError("");
        }

        const [services, servicePackagePlans] = await Promise.all([
          getAdminServices({
            activity: activityFilter,
            search: searchQuery,
          }),
          getAdminServicePackagePlans(),
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
  }, [activityFilter, searchQuery]);

  useEffect(() => {
    if (!isLoading) {
      setLastVisibleItems(items);
      setHasLoadedServicesOnce(true);
    }
  }, [isLoading, items]);

  useEffect(() => {
    if (!isPackagePlansLoading) {
      setLastVisiblePackagePlans(packagePlans);
      setHasLoadedPackagePlansOnce(true);
    }
  }, [isPackagePlansLoading, packagePlans]);

  useEffect(() => {
    if (editingServiceId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      editServiceFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editingServiceId]);

  useEffect(() => {
    if (editingPackagePlanId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      editPackagePlanFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editingPackagePlanId]);

  const resetMessages = () => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }

    if (packageError) {
      setPackageError("");
    }

    if (packageSuccessMessage) {
      setPackageSuccessMessage("");
    }
  };

  const resetPackageMessages = () => {
    if (packageError) {
      setPackageError("");
    }

    if (packageSuccessMessage) {
      setPackageSuccessMessage("");
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
    resetPackageMessages();
  };

  const handlePackagePlanEditFormChange = (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => {
    setPackagePlanEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    resetPackageMessages();
  };

  const reloadServices = async () => {
    const services = await getAdminServices({
      activity: activityFilter,
      search: searchQuery,
    });

    setItems(services);
  };

  const reloadPackagePlans = async () => {
    const servicePackagePlans = await getAdminServicePackagePlans();

    setPackagePlans(servicePackagePlans);
  };

  const reloadAllServiceData = async () => {
    const [services, servicePackagePlans] = await Promise.all([
      getAdminServices({
        activity: activityFilter,
        search: searchQuery,
      }),
      getAdminServicePackagePlans(),
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
      setSuccessMessage("");
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
      setPackageError(validationError);
      setPackageSuccessMessage("");
      return;
    }

    setIsPackagePlanCreating(true);
    setPackageError("");
    setPackageSuccessMessage("");

    try {
      await createAdminServicePackagePlan(payload);
      await reloadPackagePlans();
      setPackagePlanCreateForm(initialPackagePlanCreateForm);
      setPackageSuccessMessage("Пакет услуг создан.");
    } catch (createError) {
      setPackageError(
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
    resetPackageMessages();
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setEditForm(initialEditForm);
  };

  const cancelPackagePlanEditing = () => {
    setEditingPackagePlanId(null);
    setPackagePlanEditForm(initialPackagePlanEditForm);
    resetPackageMessages();
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
      setSuccessMessage("");
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

    if (editingPackagePlanId === null) {
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
      setPackageError(validationError);
      setPackageSuccessMessage("");
      return;
    }

    setIsPackagePlanUpdating(true);
    setPackageError("");
    setPackageSuccessMessage("");

    try {
      await updateAdminServicePackagePlan(payload);
      await reloadPackagePlans();
      setPackageSuccessMessage("Пакет услуг обновлён.");
      cancelPackagePlanEditing();
    } catch (updateError) {
      setPackageError(
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

  const handleHidePackagePlan = async (
    packagePlan: CrmServicePackagePlanRecord
  ) => {
    if (!packagePlan.isActive) {
      return;
    }

    const confirmed = window.confirm(
      "Скрыть пакет услуг из новых записей? Уже выданные клиентам пакеты и история сохранятся."
    );

    if (!confirmed) {
      return;
    }

    setHidingPackagePlanId(packagePlan.id);
    setPackageError("");
    setPackageSuccessMessage("");

    try {
      await hideAdminServicePackagePlan(packagePlan.id);
      await reloadPackagePlans();

      if (editingPackagePlanId === packagePlan.id) {
        setPackagePlanEditForm((prev) => ({
          ...prev,
          isActive: false,
        }));
      }

      setPackageSuccessMessage("Пакет услуг скрыт из записи.");
    } catch (hideError) {
      setPackageError(
        hideError instanceof Error
          ? hideError.message
          : "Не удалось скрыть пакет услуг"
      );
    } finally {
      setHidingPackagePlanId(null);
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
    const confirmed = window.confirm(
      "Удалить пакет услуг? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingPackagePlanId(id);
    setPackageError("");
    setPackageSuccessMessage("");

    try {
      await deleteAdminServicePackagePlan(id);
      await reloadPackagePlans();

      if (editingPackagePlanId === id) {
        cancelPackagePlanEditing();
      }

      setPackageSuccessMessage("Пакет услуг удалён.");
    } catch (deleteError) {
      setPackageError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить пакет услуг"
      );
    } finally {
      setDeletingPackagePlanId(null);
    }
  };

  const displayedItems =
    isLoading && hasLoadedServicesOnce ? lastVisibleItems : items;
  const isServicesInitialLoading = isLoading && !hasLoadedServicesOnce;
  const isServicesRefreshing = isLoading && hasLoadedServicesOnce;

  const displayedPackagePlans =
    isPackagePlansLoading && hasLoadedPackagePlansOnce
      ? lastVisiblePackagePlans
      : packagePlans;
  const isPackagePlansInitialLoading =
    isPackagePlansLoading && !hasLoadedPackagePlansOnce;
  const isPackagePlansRefreshing =
    isPackagePlansLoading && hasLoadedPackagePlansOnce;

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
        <div ref={editServiceFormRef}>
          <ServiceEditForm
            form={editForm}
            isUpdating={isUpdating}
            onCancel={cancelEditing}
            onChange={handleEditFormChange}
            onSubmit={handleUpdateService}
          />
        </div>
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

      {isServicesInitialLoading ? (
        <p>Загрузка...</p>
      ) : displayedItems.length === 0 ? (
        <AdminRefreshableTableArea isRefreshing={isServicesRefreshing}>
          <p>Услуг пока нет.</p>
        </AdminRefreshableTableArea>
      ) : (
        <AdminRefreshableTableArea isRefreshing={isServicesRefreshing}>
          <ServicesTable
            items={displayedItems}
            deletingId={deletingId}
            hidingId={hidingId}
            onEdit={startEditing}
            onDelete={handleDeleteService}
            onHide={handleHideService}
          />
        </AdminRefreshableTableArea>
      )}

      <div className={styles.packagePlansHeader}>
        <h2 className={styles.packagePlansTitle}>Пакеты услуг</h2>
        <p className={styles.packagePlansDescription}>
          Здесь можно создать пакеты на основе обычных услуг: например 4, 8 или
          12 разовых сессий по отдельной цене.
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
        <div ref={editPackagePlanFormRef}>
          <ServicePackagePlanEditForm
            form={packagePlanEditForm}
            isUpdating={isPackagePlanUpdating}
            services={items}
            onCancel={cancelPackagePlanEditing}
            onChange={handlePackagePlanEditFormChange}
            onSubmit={handleUpdatePackagePlan}
          />
        </div>
      ) : null}

      <AdminFeedback message={packageError} tone="error" />
      <AdminFeedback message={packageSuccessMessage} tone="success" />

      {isPackagePlansInitialLoading ? (
        <p>Загрузка пакетов...</p>
      ) : displayedPackagePlans.length === 0 ? (
        <AdminRefreshableTableArea isRefreshing={isPackagePlansRefreshing}>
          <p className={styles.empty}>Пакетов услуг пока нет.</p>
        </AdminRefreshableTableArea>
      ) : (
        <AdminRefreshableTableArea isRefreshing={isPackagePlansRefreshing}>
          <ServicePackagePlansTable
            items={displayedPackagePlans}
            deletingId={deletingPackagePlanId}
            hidingId={hidingPackagePlanId}
            onEdit={startEditingPackagePlan}
            onDelete={handleDeletePackagePlan}
            onHide={handleHidePackagePlan}
          />
        </AdminRefreshableTableArea>
      )}
    </main>
  );
}