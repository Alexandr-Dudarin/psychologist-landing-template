import {
  getPublicServicePackagePlans as getDbPackagePlans,
  getPublicServices as getDbServices,
} from "../api/publicServices";
import { getPricingSourceMode } from "../booking/getBookingTarget";
import { config } from "../../data/config";
import type {
  CrmServiceRecord,
  PublicServicePackagePlanRecord,
} from "../../types/service";

// единый формат для публички
export type PublicPricingService = {
  id: string;
  bookingServiceId?: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  price: number;
};

export type PublicPricingPackagePlan = {
  id: string;
  packagePlanId: number;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  title: string;
  description?: string;
  sessionsCount: number;
  price: number;
};

// --- CONFIG → PUBLIC ---
function mapConfigServices(): PublicPricingService[] {
  return config.pricing.map((item, index) => ({
    id: `config-${index}`,
    title: item.title,
    description: item.description,
    price: parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0,
  }));
}

// --- DATABASE → PUBLIC ---
function mapDatabaseServices(
  items: CrmServiceRecord[]
): PublicPricingService[] {
  return items
    .filter((item) => item.isActive)
    .map((item) => ({
      id: String(item.id),
      bookingServiceId: item.id,
      title: item.title,
      description: item.description ?? undefined,
      durationMinutes: item.durationMinutes,
      price: item.price,
    }));
}

function mapDatabasePackagePlans(
  items: PublicServicePackagePlanRecord[]
): PublicPricingPackagePlan[] {
  return items.map((item) => ({
    id: `package-${item.id}`,
    packagePlanId: item.id,
    serviceId: item.serviceId,
    serviceTitle: item.serviceTitle,
    serviceDurationMinutes: item.serviceDurationMinutes,
    title: item.title,
    description: item.description || undefined,
    sessionsCount: item.sessionsCount,
    price: item.price,
  }));
}

// --- MAIN ---
export async function getPublicPricingServices(): Promise<
  PublicPricingService[]
> {
  const source = getPricingSourceMode();

  if (source === "config") {
    return mapConfigServices();
  }

  const dbServices = await getDbServices();
  return mapDatabaseServices(dbServices);
}

export async function getPublicPricingPackagePlans(): Promise<
  PublicPricingPackagePlan[]
> {
  const source = getPricingSourceMode();

  if (source === "config") {
    return [];
  }

  const dbPackagePlans = await getDbPackagePlans();
  return mapDatabasePackagePlans(dbPackagePlans);
}