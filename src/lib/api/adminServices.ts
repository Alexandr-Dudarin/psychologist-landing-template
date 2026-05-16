import type {
  CreateServicePackagePlanPayload,
  CreateServicePayload,
  CrmServicePackagePlanRecord,
  CrmServiceRecord,
  UpdateServicePackagePlanPayload,
  UpdateServicePayload,
} from "../../types/service";

type ListServicesResponse = {
  items: CrmServiceRecord[];
};

type ListServicesErrorResponse = {
  error: string;
};

type CreateServiceResponse = {
  success: true;
  item: CrmServiceRecord;
};

type CreateServiceErrorResponse = {
  error: string;
};

type UpdateServiceResponse = {
  success: true;
  item: CrmServiceRecord;
};

type UpdateServiceErrorResponse = {
  error: string;
};

type DeleteServiceResponse = {
  success: true;
  id: number;
};

type DeleteServiceErrorResponse = {
  error: string;
};

type ListServicePackagePlansResponse = {
  items: CrmServicePackagePlanRecord[];
};

type ListServicePackagePlansErrorResponse = {
  error: string;
};

type CreateServicePackagePlanResponse = {
  success: true;
  item: CrmServicePackagePlanRecord;
};

type CreateServicePackagePlanErrorResponse = {
  error: string;
};

type UpdateServicePackagePlanResponse = {
  success: true;
  item: CrmServicePackagePlanRecord;
};

type UpdateServicePackagePlanErrorResponse = {
  error: string;
};

type DeleteServicePackagePlanResponse = {
  success: true;
  id: number;
};

type DeleteServicePackagePlanErrorResponse = {
  error: string;
};

export type AdminServicesFilters = {
  activity?: "all" | "active" | "inactive";
  search?: string;
};

export async function getAdminServices(
  filters: AdminServicesFilters = {}
): Promise<CrmServiceRecord[]> {
  const params = new URLSearchParams();

  if (filters.activity) {
    params.set("activity", filters.activity);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/services?${queryString}`
    : "/api/admin/services";

  const response = await fetch(url);

  const data = (await response.json().catch(() => null)) as
    | ListServicesResponse
    | ListServicesErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить услуги"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}

export async function createAdminService(
  payload: CreateServicePayload
): Promise<CrmServiceRecord> {
  const response = await fetch("/api/admin/services?action=create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateServiceResponse
    | CreateServiceErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось создать услугу"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось создать услугу");
}

export async function updateAdminService(
  payload: UpdateServicePayload
): Promise<CrmServiceRecord> {
  const response = await fetch("/api/admin/services?action=update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateServiceResponse
    | UpdateServiceErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось обновить услугу"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось обновить услугу");
}

export async function deleteAdminService(id: number): Promise<number> {
  const response = await fetch("/api/admin/services?action=delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteServiceResponse
    | DeleteServiceErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось удалить услугу"
    );
  }

  if (data && "id" in data) {
    return data.id;
  }

  throw new Error("Не удалось удалить услугу");
}

export async function getAdminServicePackagePlans(): Promise<
  CrmServicePackagePlanRecord[]
> {
  const response = await fetch("/api/admin/services?action=list-package-plans");

  const data = (await response.json().catch(() => null)) as
    | ListServicePackagePlansResponse
    | ListServicePackagePlansErrorResponse
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
): Promise<CrmServicePackagePlanRecord> {
  const response = await fetch("/api/admin/services?action=create-package-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateServicePackagePlanResponse
    | CreateServicePackagePlanErrorResponse
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
): Promise<CrmServicePackagePlanRecord> {
  const response = await fetch("/api/admin/services?action=update-package-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateServicePackagePlanResponse
    | UpdateServicePackagePlanErrorResponse
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
    | DeleteServicePackagePlanErrorResponse
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