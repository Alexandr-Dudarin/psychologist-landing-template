import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionListScope,
  SessionStatus,
  UpdateSessionPayload,
} from "../../types/session";

type ListSessionsResponse = {
  items: CrmSessionRecord[];
  hasMore?: boolean;
};

type ListSessionsErrorResponse = {
  error: string;
};

type CreateSessionResponse = {
  success: true;
  item: CrmSessionRecord;
};

type CreateSessionErrorResponse = {
  error: string;
};

type UpdateSessionResponse = {
  success: true;
  item: CrmSessionRecord;
};

type UpdateSessionErrorResponse = {
  error: string;
};

type DeleteSessionResponse = {
  success: true;
  id: number;
};

type DeleteSessionErrorResponse = {
  error: string;
};

export type AdminSessionsFilters = {
  status?: SessionStatus | "all";
  clientId?: number | "all";
  serviceId?: number | "all";
  search?: string;
  scope?: SessionListScope;
  date?: string | null;
  timezone?: string;
  limit?: number;
  offset?: number;
};

export type AdminSessionsPageResult = {
  items: CrmSessionRecord[];
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

export async function getAdminSessionsPage(
  filters: AdminSessionsFilters = {}
): Promise<AdminSessionsPageResult> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.scope) {
    params.set("scope", filters.scope);
  }

  if (filters.clientId !== undefined) {
    params.set("clientId", String(filters.clientId));
  }

  if (filters.serviceId !== undefined) {
    params.set("serviceId", String(filters.serviceId));
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.date?.trim()) {
    params.set("date", filters.date.trim());
  }

  if (filters.timezone?.trim()) {
    params.set("timezone", filters.timezone.trim());
  }

  appendNumberParam(params, "limit", filters.limit);
  appendNumberParam(params, "offset", filters.offset);

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/sessions?${queryString}`
    : "/api/admin/sessions";

  const response = await fetch(url);

  const data = (await response.json().catch(() => null)) as
    | ListSessionsResponse
    | ListSessionsErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить сессии"
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

export async function getAdminSessions(
  filters: AdminSessionsFilters = {}
): Promise<CrmSessionRecord[]> {
  const result = await getAdminSessionsPage(filters);

  return result.items;
}

export async function createAdminSession(
  payload: CreateSessionPayload
): Promise<CrmSessionRecord> {
  const response = await fetch("/api/admin/sessions?action=create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateSessionResponse
    | CreateSessionErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось создать сессию"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось создать сессию");
}

export async function updateAdminSession(
  payload: UpdateSessionPayload
): Promise<CrmSessionRecord> {
  const response = await fetch("/api/admin/sessions?action=update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateSessionResponse
    | UpdateSessionErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось обновить сессию"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось обновить сессию");
}

export async function deleteAdminSession(id: number): Promise<number> {
  const response = await fetch("/api/admin/sessions?action=delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteSessionResponse
    | DeleteSessionErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось удалить сессию"
    );
  }

  if (data && "id" in data) {
    return data.id;
  }

  throw new Error("Не удалось удалить сессию");
}