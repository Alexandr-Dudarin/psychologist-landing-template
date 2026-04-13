import type {
  CrmClientRecord,
  ClientStatus,
  CreateManualClientPayload,
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
};

type CreateManualClientErrorResponse = {
  error: string;
};

export type AdminClientsFilters = {
  status?: ClientStatus | "all";
  search?: string;
};

export async function getAdminClients(
  filters: AdminClientsFilters = {}
): Promise<CrmClientRecord[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/clients/list?${queryString}`
    : "/api/admin/clients/list";

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
  const response = await fetch("/api/admin/clients/create-from-request", {
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
): Promise<CrmClientRecord> {
  const response = await fetch("/api/admin/clients/create", {
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
    return data.item;
  }

  throw new Error("Failed to create client");
}