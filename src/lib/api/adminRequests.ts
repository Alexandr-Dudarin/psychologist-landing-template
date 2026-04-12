import type {
  CrmRequestRecord,
  RequestStatus,
  UpdateRequestStatusPayload,
} from "../../types/request";

type ListAdminRequestsResponse = {
  items: CrmRequestRecord[];
};

type ListAdminRequestsErrorResponse = {
  error: string;
};

type UpdateRequestStatusResponse = {
  success: true;
  item: {
    id: number;
    status: RequestStatus;
  };
};

type UpdateRequestStatusErrorResponse = {
  error: string;
};

export type AdminRequestsFilters = {
  status?: RequestStatus | "all";
  search?: string;
};

export async function getAdminRequests(
  filters: AdminRequestsFilters = {}
): Promise<CrmRequestRecord[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/requests/list?${queryString}`
    : "/api/admin/requests/list";

  const response = await fetch(url);

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

export async function updateAdminRequestStatus(
  payload: UpdateRequestStatusPayload
): Promise<{ id: number; status: RequestStatus }> {
  const response = await fetch("/api/admin/requests/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateRequestStatusResponse
    | UpdateRequestStatusErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Failed to update request status"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Failed to update request status");
}