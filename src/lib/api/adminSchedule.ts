import type {
  AdminScheduleRecord,
  UpdateAdminSchedulePayload,
} from "../../types/schedule";

type GetAdminScheduleErrorResponse = {
  error: string;
};

type UpdateAdminScheduleResponse = {
  success: true;
  settings: AdminScheduleRecord["settings"];
  rules: AdminScheduleRecord["rules"];
};

type UpdateAdminScheduleErrorResponse = {
  error: string;
};

export async function getAdminSchedule(): Promise<AdminScheduleRecord> {
  const response = await fetch("/api/admin/schedule/get");

  const data = (await response.json().catch(() => null)) as
    | AdminScheduleRecord
    | GetAdminScheduleErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить расписание"
    );
  }

  if (data && "settings" in data && "rules" in data) {
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
    | UpdateAdminScheduleErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось сохранить расписание"
    );
  }

  if (data && "settings" in data && "rules" in data) {
    return {
      settings: data.settings,
      rules: data.rules,
    };
  }

  throw new Error("Не удалось сохранить расписание");
}