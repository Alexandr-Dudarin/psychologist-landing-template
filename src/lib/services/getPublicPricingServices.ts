import { getPublicServices as getDbServices } from "../api/publicServices";
import { getPricingSourceMode } from "../booking/getBookingTarget";
import { config } from "../../data/config";
import type { CrmServiceRecord } from "../../types/service";

// единый формат для публички
export type PublicPricingService = {
  id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
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
      title: item.title,
      description: item.description ?? undefined,
      durationMinutes: item.durationMinutes,
      price: item.price,
    }));
}

// --- MAIN ---
export async function getPublicPricingServices(): Promise<PublicPricingService[]> {
  const source = getPricingSourceMode();

  if (source === "config") {
    return mapConfigServices();
  }

  const dbServices = await getDbServices();
  return mapDatabaseServices(dbServices);
}