import type { CrmServiceRecord } from "../../types/service";

type PublicServicesResponse = {
  items: CrmServiceRecord[];
};

type PublicServicesErrorResponse = {
  error: string;
};

export async function getPublicServices(): Promise<CrmServiceRecord[]> {
  const response = await fetch("/api/public/services/list");

  const data = (await response.json().catch(() => null)) as
    | PublicServicesResponse
    | PublicServicesErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error
        : "Не удалось загрузить услуги для публичного прайса."
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}
