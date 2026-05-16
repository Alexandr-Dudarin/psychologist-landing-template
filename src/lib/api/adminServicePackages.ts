import type {
  CreateServicePackagePlanPayload,
  ServicePackagePlanActivityFilter,
  ServicePackagePlanRecord,
  UpdateServicePackagePlanPayload,
} from "../../types/servicePackage";

type ListServicePackagePlansResponse = {
  items: ServicePackagePlanRecord[];
};

type ServicePackagePlanMutationResponse = {
  success: true;
  item: ServicePackagePlanRecord;
};

type DeleteServicePackagePlanResponse = {
  success: true;
  id: number;
};

type ApiErrorResponse = {
  error: string;
};

export type AdminServicePackagePlansFilters = {
  activity?: ServicePackagePlanActivityFilter;
  serviceId?: number | "all";
  search?: string;
};

export async function getAdminServicePackagePlans(
  filters: AdminServicePackagePlansFilters = {}
): Promise<ServicePackagePlanRecord[]> {
  const params = new URLSearchParams();

  params.set("action", "list-package-plans");

  if (filters.activity) {
    params.set("activity", filters.activity);
  }

  if (filters.serviceId !== undefined) {
    params.set("serviceId", String(filters.serviceId));
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const response = await fetch(`/api/admin/services?${params.toString()}`);

  const data = (await response.json().catch(() => null)) as
    | ListServicePackagePlansResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить пакеты услуг"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}

export async function createAdminServicePackagePlan(
  payload: CreateServicePackagePlanPayload
): Promise<ServicePackagePlanRecord> {
  const response = await fetch("/api/admin/services?action=create-package-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | ServicePackagePlanMutationResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось создать пакет услуг"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось создать пакет услуг");
}

export async function updateAdminServicePackagePlan(
  payload: UpdateServicePackagePlanPayload
): Promise<ServicePackagePlanRecord> {
  const response = await fetch("/api/admin/services?action=update-package-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | ServicePackagePlanMutationResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось обновить пакет услуг"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось обновить пакет услуг");
}

export async function deleteAdminServicePackagePlan(id: number): Promise<number> {
  const response = await fetch("/api/admin/services?action=delete-package-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteServicePackagePlanResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось удалить пакет услуг"
    );
  }

  if (data && "id" in data) {
    return data.id;
  }

  throw new Error("Не удалось удалить пакет услуг");
}