import type {
  CrmNoteRecord,
  CreateNotePayload,
  UpdateNotePayload,
} from "../../types/note";

type ListNotesResponse = {
  items: CrmNoteRecord[];
};

type ListNotesErrorResponse = {
  error: string;
};

type CreateNoteResponse = {
  success: true;
  item: CrmNoteRecord;
};

type CreateNoteErrorResponse = {
  error: string;
};

type UpdateNoteResponse = {
  success: true;
  item: CrmNoteRecord;
};

type UpdateNoteErrorResponse = {
  error: string;
};

type DeleteNoteResponse = {
  success: true;
  id: number;
};

type DeleteNoteErrorResponse = {
  error: string;
};

export type AdminNotesFilters = {
  clientId?: number | "all";
  search?: string;
};

export async function getAdminNotes(
  filters: AdminNotesFilters = {}
): Promise<CrmNoteRecord[]> {
  const params = new URLSearchParams();

  if (filters.clientId !== undefined) {
    params.set("clientId", String(filters.clientId));
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/admin/notes/list?${queryString}`
    : "/api/admin/notes/list";

  const response = await fetch(url);

  const data = (await response.json().catch(() => null)) as
    | ListNotesResponse
    | ListNotesErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить заметки"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}

export async function createAdminNote(
  payload: CreateNotePayload
): Promise<CrmNoteRecord> {
  const response = await fetch("/api/admin/notes/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateNoteResponse
    | CreateNoteErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось создать заметку"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось создать заметку");
}

export async function updateAdminNote(
  payload: UpdateNotePayload
): Promise<CrmNoteRecord> {
  const response = await fetch("/api/admin/notes/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateNoteResponse
    | UpdateNoteErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось обновить заметку"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось обновить заметку");
}

export async function deleteAdminNote(id: number): Promise<number> {
  const response = await fetch("/api/admin/notes/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteNoteResponse
    | DeleteNoteErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось удалить заметку"
    );
  }

  if (data && "id" in data) {
    return data.id;
  }

  throw new Error("Не удалось удалить заметку");
}