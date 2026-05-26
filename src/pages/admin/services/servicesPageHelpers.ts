import type {
  CreateServicePackagePlanPayload,
  CreateServicePayload,
  CrmServicePackagePlanRecord,
  CrmServiceRecord,
  UpdateServicePackagePlanPayload,
  UpdateServicePayload,
} from "../../../types/service";

export type ServiceActivityFilter = "all" | "active" | "inactive";

export type PackageActivityFilter = "all" | "active" | "inactive";

export function validateServicePayload(
  payload: CreateServicePayload | UpdateServicePayload
): string | null {
  if (!payload.title) {
    return "Название услуги обязательно.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену.";
  }

  if (
    !Number.isInteger(payload.durationMinutes) ||
    payload.durationMinutes <= 0
  ) {
    return "Укажите корректную длительность в минутах.";
  }

  return null;
}

export function validatePackagePlanPayload(
  payload: CreateServicePackagePlanPayload | UpdateServicePackagePlanPayload
): string | null {
  if (!Number.isInteger(payload.serviceId) || payload.serviceId <= 0) {
    return "Выберите базовую услугу для пакета.";
  }

  if (!payload.title) {
    return "Название пакета обязательно.";
  }

  if (!Number.isInteger(payload.sessionsCount) || payload.sessionsCount <= 0) {
    return "Укажите корректное количество сессий в пакете.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Укажите корректную цену пакета.";
  }

  return null;
}

export function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function doesServiceMatchActivity(
  service: CrmServiceRecord,
  activityFilter: ServiceActivityFilter
): boolean {
  if (activityFilter === "active") {
    return service.isActive === true;
  }

  if (activityFilter === "inactive") {
    return service.isActive === false;
  }

  return true;
}

export function doesServiceMatchSearch(
  service: CrmServiceRecord,
  searchQuery: string
): boolean {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return [service.title, service.description].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  );
}

export function filterServices(
  services: CrmServiceRecord[],
  activityFilter: ServiceActivityFilter,
  searchQuery: string
): CrmServiceRecord[] {
  return services.filter(
    (service) =>
      doesServiceMatchActivity(service, activityFilter) &&
      doesServiceMatchSearch(service, searchQuery)
  );
}

export function doesPackagePlanMatchActivity(
  packagePlan: CrmServicePackagePlanRecord,
  activityFilter: PackageActivityFilter
): boolean {
  if (activityFilter === "active") {
    return packagePlan.isActive === true;
  }

  if (activityFilter === "inactive") {
    return packagePlan.isActive === false;
  }

  return true;
}

export function doesPackagePlanMatchSearch(
  packagePlan: CrmServicePackagePlanRecord,
  searchQuery: string
): boolean {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return [
    packagePlan.title,
    packagePlan.description,
    packagePlan.serviceTitle,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function filterPackagePlans(
  packagePlans: CrmServicePackagePlanRecord[],
  activityFilter: PackageActivityFilter,
  searchQuery: string
): CrmServicePackagePlanRecord[] {
  return packagePlans.filter(
    (packagePlan) =>
      doesPackagePlanMatchActivity(packagePlan, activityFilter) &&
      doesPackagePlanMatchSearch(packagePlan, searchQuery)
  );
}
