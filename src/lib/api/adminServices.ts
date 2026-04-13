import type {
  CrmServiceRecord,
  CreateServicePayload,
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
    ? `/api/admin/services/list?${queryString}`
    : "/api/admin/services/list";

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
  const response = await fetch("/api/admin/services/create", {
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
  const response = await fetch("/api/admin/services/update", {
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
  const response = await fetch("/api/admin/services/delete", {
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