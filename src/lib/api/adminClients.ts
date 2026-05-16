import type {
  AssignClientServicePackagePayload,
  ClientFavoriteFilter,
  ClientStatus,
  CreateManualClientPayload,
  CrmClientRecord,
  CrmClientServicePackageRecord,
  UpdateClientPayload,
} from "../../types/client";

type ListClientsResponse = {
  items: CrmClientRecord[];
};

type ListClientsErrorResponse = {
  error: string;
};

type CreateClientFromRequestResponse = {
  success: true;
  item: CrmClientRecord;
  alreadyExisted: boolean;
};

type CreateClientFromRequestErrorResponse = {
  error: string;
};

type CreateManualClientResponse = {
  success: true;
  item: CrmClientRecord;
  alreadyExisted: boolean;
};

type CreateManualClientErrorResponse = {
  error: string;
};

type UpdateClientResponse = {
  success: true;
  item: CrmClientRecord;
};

type UpdateClientErrorResponse = {
  error: string;
};

type ToggleClientFavoriteResponse = {
  success: true;
  item: CrmClientRecord;
};

type ToggleClientFavoriteErrorResponse = {
  error: string;
};

type ListClientServicePackagesResponse = {
  items: CrmClientServicePackageRecord[];
};

type ListClientServicePackagesErrorResponse = {
  error: string;
};

type AssignClientServicePackageResponse = {
  success: true;
  item: CrmClientServicePackageRecord;
};

type AssignClientServicePackageErrorResponse = {
  error: string;
};

export type AdminClientsFilters = {
  status?: ClientStatus | "all";
  favorite?: ClientFavoriteFilter;
  search?: string;
};

export async function getAdminClients(
  filters: AdminClientsFilters = {}
): Promise<CrmClientRecord[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.favorite) {
    params.set("favorite", filters.favorite);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/clients?${queryString}`
    : "/api/admin/clients";

  const response = await fetch(url);

  const data = (await response.json().catch(() => null)) as
    | ListClientsResponse
    | ListClientsErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Failed to load clients"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}

export async function createClientFromRequest(
  requestId: number
): Promise<{ item: CrmClientRecord; alreadyExisted: boolean }> {
  const response = await fetch("/api/admin/clients?action=create-from-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestId }),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateClientFromRequestResponse
    | CreateClientFromRequestErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Failed to create client"
    );
  }

  if (data && "item" in data) {
    return {
      item: data.item,
      alreadyExisted: data.alreadyExisted,
    };
  }

  throw new Error("Failed to create client");
}

export async function createManualClient(
  payload: CreateManualClientPayload
): Promise<{ item: CrmClientRecord; alreadyExisted: boolean }> {
  const response = await fetch("/api/admin/clients?action=create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateManualClientResponse
    | CreateManualClientErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Failed to create client"
    );
  }

  if (data && "item" in data) {
    return {
      item: data.item,
      alreadyExisted: data.alreadyExisted,
    };
  }

  throw new Error("Failed to create client");
}

export async function updateClient(
  payload: UpdateClientPayload
): Promise<CrmClientRecord> {
  const response = await fetch("/api/admin/clients?action=update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateClientResponse
    | UpdateClientErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Failed to update client"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Failed to update client");
}

export async function toggleClientFavorite(
  id: number
): Promise<CrmClientRecord> {
  const response = await fetch("/api/admin/clients?action=toggle-favorite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json().catch(() => null)) as
    | ToggleClientFavoriteResponse
    | ToggleClientFavoriteErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось изменить избранное"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось изменить избранное");
}

export async function getClientServicePackages(
  clientId: number
): Promise<CrmClientServicePackageRecord[]> {
  const params = new URLSearchParams({
    action: "list-packages",
    clientId: String(clientId),
  });

  const response = await fetch(`/api/admin/clients?${params.toString()}`);

  const data = (await response.json().catch(() => null)) as
    | ListClientServicePackagesResponse
    | ListClientServicePackagesErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось загрузить пакеты клиента"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}

export async function assignClientServicePackage(
  payload: AssignClientServicePackagePayload
): Promise<CrmClientServicePackageRecord> {
  const response = await fetch("/api/admin/clients?action=assign-package", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | AssignClientServicePackageResponse
    | AssignClientServicePackageErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось добавить пакет клиенту"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось добавить пакет клиенту");
}