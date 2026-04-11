import type { CrmRequestRecord } from "../../types/request";

type ListAdminRequestsResponse = {
  items: CrmRequestRecord[];
};

type ListAdminRequestsErrorResponse = {
  error: string;
};

export async function getAdminRequests(): Promise<CrmRequestRecord[]> {
  const response = await fetch("/api/admin/requests/list");

  const data = (await response.json().catch(() => null)) as
    | ListAdminRequestsResponse
    | ListAdminRequestsErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Failed to load requests"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}