import type {
  AdminScheduleRecord,
  BlockedSlotRecord,
  CreateBlockedSlotPayload,
  CreateScheduleOverridePayload,
  ScheduleOverrideRecord,
  UpdateAdminSchedulePayload,
} from "../../types/schedule";

type ErrorResponse = {
  error: string;
};

type UpdateAdminScheduleResponse = {
  success: true;
  settings: AdminScheduleRecord["settings"];
  rules: AdminScheduleRecord["rules"];
  overrides: AdminScheduleRecord["overrides"];
  blockedSlots: AdminScheduleRecord["blockedSlots"];
};

type CreateOverrideResponse = {
  success: true;
  item: ScheduleOverrideRecord;
};

type DeleteOverrideResponse = {
  success: true;
  date: string;
};

type CreateBlockedSlotResponse = {
  success: true;
  item: BlockedSlotRecord;
};

type DeleteBlockedSlotResponse = {
  success: true;
  id: number;
};

export type UpdateScheduleOverridePayload = {
  originalDate: string;
  date: string;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string;
};

export type UpdateBlockedSlotPayload = {
  id: number;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export async function getAdminSchedule(): Promise<AdminScheduleRecord> {
  const response = await fetch("/api/admin/schedule/get");

  const data = (await response.json().catch(() => null)) as
    | AdminScheduleRecord
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить расписание"
    );
  }

  if (
    data &&
    "settings" in data &&
    "rules" in data &&
    "overrides" in data &&
    "blockedSlots" in data
  ) {
    return data;
  }

  throw new Error("Не удалось загрузить расписание");
}

export async function updateAdminSchedule(
  payload: UpdateAdminSchedulePayload
): Promise<AdminScheduleRecord> {
  const response = await fetch("/api/admin/schedule/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateAdminScheduleResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось сохранить расписание"
    );
  }

  if (
    data &&
    "settings" in data &&
    "rules" in data &&
    "overrides" in data &&
    "blockedSlots" in data
  ) {
    return {
      settings: data.settings,
      rules: data.rules,
      overrides: data.overrides,
      blockedSlots: data.blockedSlots,
    };
  }

  throw new Error("Не удалось сохранить расписание");
}

export async function createScheduleOverride(
  payload: CreateScheduleOverridePayload
): Promise<ScheduleOverrideRecord> {
  const response = await fetch("/api/admin/schedule/create-override", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateOverrideResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось сохранить исключение по дате"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось сохранить исключение по дате");
}

export async function updateScheduleOverride(
  payload: UpdateScheduleOverridePayload
): Promise<ScheduleOverrideRecord> {
  const response = await fetch("/api/admin/schedule/update-override", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateOverrideResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось обновить исключение по дате"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось обновить исключение по дате");
}

export async function deleteScheduleOverride(date: string): Promise<string> {
  const response = await fetch("/api/admin/schedule/delete-override", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date }),
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteOverrideResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось удалить исключение по дате"
    );
  }

  if (data && "date" in data) {
    return data.date;
  }

  throw new Error("Не удалось удалить исключение по дате");
}

export async function createBlockedSlot(
  payload: CreateBlockedSlotPayload
): Promise<BlockedSlotRecord> {
  const response = await fetch("/api/admin/schedule/create-blocked-slot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateBlockedSlotResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось создать блокировку слота"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось создать блокировку слота");
}

export async function updateBlockedSlot(
  payload: UpdateBlockedSlotPayload
): Promise<BlockedSlotRecord> {
  const response = await fetch("/api/admin/schedule/update-blocked-slot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateBlockedSlotResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось обновить блокировку слота"
    );
  }

  if (data && "item" in data) {
    return data.item;
  }

  throw new Error("Не удалось обновить блокировку слота");
}

export async function deleteBlockedSlot(id: number): Promise<number> {
  const response = await fetch("/api/admin/schedule/delete-blocked-slot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteBlockedSlotResponse
    | ErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось удалить блокировку"
    );
  }

  if (data && "id" in data) {
    return data.id;
  }

  throw new Error("Не удалось удалить блокировку");
}