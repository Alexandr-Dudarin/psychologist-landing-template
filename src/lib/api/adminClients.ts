import type { CrmClientRecord } from "../../types/client";

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

export async function getAdminClients(): Promise<CrmClientRecord[]> {
  const response = await fetch("/api/admin/clients/list");

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