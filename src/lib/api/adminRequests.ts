import type {
  CrmRequestRecord,
  RequestStatus,
  UpdateRequestStatusPayload,
} from "../../types/request";

export type AdminRequestsScope = "all" | "active" | "old";

type ListAdminRequestsResponse = {
  items: CrmRequestRecord[];
  hasMore?: boolean;
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

type MarkRequestsViewedResponse = {
  success: true;
  items: Array<{
    id: number;
    viewedAt: string;
  }>;
};

type MarkRequestsViewedErrorResponse = {
  error: string;
};

export type AdminRequestsFilters = {
  status?: RequestStatus | "all";
  search?: string;
  scope?: AdminRequestsScope;
  limit?: number;
  offset?: number;
};

export type AdminRequestsPageResult = {
  items: CrmRequestRecord[];
  hasMore: boolean;
};

function appendNumberParam(
  params: URLSearchParams,
  name: string,
  value: number | undefined
) {
  if (typeof value !== "number") {
    return;
  }

  if (!Number.isFinite(value)) {
    return;
  }

  params.set(name, String(value));
}

export async function getAdminRequestsPage(
  filters: AdminRequestsFilters = {}
): Promise<AdminRequestsPageResult> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.scope) {
    params.set("scope", filters.scope);
  }

  appendNumberParam(params, "limit", filters.limit);
  appendNumberParam(params, "offset", filters.offset);

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/requests?${queryString}`
    : "/api/admin/requests";

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
    return {
      items: data.items,
      hasMore: Boolean(data.hasMore),
    };
  }

  return {
    items: [],
    hasMore: false,
  };
}

export async function getAdminRequests(
  filters: AdminRequestsFilters = {}
): Promise<CrmRequestRecord[]> {
  const result = await getAdminRequestsPage(filters);

  return result.items;
}

export async function updateAdminRequestStatus(
  payload: UpdateRequestStatusPayload
): Promise<{ id: number; status: RequestStatus }> {
  const response = await fetch("/api/admin/requests?action=update", {
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

export async function markAdminRequestsViewed(
  ids: number[]
): Promise<Array<{ id: number; viewedAt: string }>> {
  const uniqueIds = Array.from(
    new Set(
      ids.filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (uniqueIds.length === 0) {
    return [];
  }

  const response = await fetch("/api/admin/requests?action=mark-viewed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids: uniqueIds,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | MarkRequestsViewedResponse
    | MarkRequestsViewedErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Failed to mark requests as viewed"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  throw new Error("Failed to mark requests as viewed");
}