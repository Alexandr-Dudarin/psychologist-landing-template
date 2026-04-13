import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionStatus,
} from "../../types/session";

type ListSessionsResponse = {
  items: CrmSessionRecord[];
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

export type AdminSessionsFilters = {
  status?: SessionStatus | "all";
  search?: string;
};

export async function getAdminSessions(
  filters: AdminSessionsFilters = {}
): Promise<CrmSessionRecord[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/sessions/list?${queryString}`
    : "/api/admin/sessions/list";

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
    return data.items;
  }

  return [];
}

export async function createAdminSession(
  payload: CreateSessionPayload
): Promise<CrmSessionRecord> {
  const response = await fetch("/api/admin/sessions/create", {
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