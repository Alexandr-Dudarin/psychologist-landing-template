import type {
  CrmServiceRecord,
  PublicServicePackagePlanRecord,
} from "../../types/service";

export type PublicServicesData = {
  items: CrmServiceRecord[];
  packagePlans: PublicServicePackagePlanRecord[];
};

type PublicServicesResponse = {
  items: CrmServiceRecord[];
  packagePlans?: PublicServicePackagePlanRecord[];
};

type PublicServicesErrorResponse = {
  error: string;
};

async function fetchPublicServicesData(): Promise<PublicServicesData> {
  const response = await fetch("/api/public/services");

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
    return {
      items: data.items,
      packagePlans: data.packagePlans ?? [],
    };
  }

  return {
    items: [],
    packagePlans: [],
  };
}

export async function getPublicServices(): Promise<CrmServiceRecord[]> {
  const data = await fetchPublicServicesData();

  return data.items;
}

export async function getPublicServicePackagePlans(): Promise<
  PublicServicePackagePlanRecord[]
> {
  const data = await fetchPublicServicesData();

  return data.packagePlans;
}

export async function getPublicServicesData(): Promise<PublicServicesData> {
  return fetchPublicServicesData();
}