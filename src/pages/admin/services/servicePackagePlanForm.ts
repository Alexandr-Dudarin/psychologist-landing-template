import type { CrmServicePackagePlanRecord } from "../../../types/service";

export type ServicePackagePlanForm = {
  serviceId: string;
  title: string;
  description: string;
  sessionsCount: string;
  price: string;
  isActive: boolean;
};

export const initialPackagePlanCreateForm: ServicePackagePlanForm = {
  serviceId: "",
  title: "",
  description: "",
  sessionsCount: "4",
  price: "",
  isActive: true,
};

export const initialPackagePlanEditForm: ServicePackagePlanForm = {
  serviceId: "",
  title: "",
  description: "",
  sessionsCount: "4",
  price: "",
  isActive: true,
};

export function mapPackagePlanToForm(
  packagePlan: CrmServicePackagePlanRecord
): ServicePackagePlanForm {
  return {
    serviceId: String(packagePlan.serviceId),
    title: packagePlan.title,
    description: packagePlan.description,
    sessionsCount: String(packagePlan.sessionsCount),
    price: String(packagePlan.price),
    isActive: packagePlan.isActive,
  };
}