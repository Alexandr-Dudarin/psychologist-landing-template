export type ServicePackagePlanRecord = {
  id: number;
  serviceId: number;
  serviceTitle: string;
  title: string;
  description: string;
  sessionsCount: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateServicePackagePlanPayload = {
  serviceId: number;
  title: string;
  description?: string;
  sessionsCount: number;
  price: number;
  isActive?: boolean;
};

export type UpdateServicePackagePlanPayload =
  CreateServicePackagePlanPayload & {
    id: number;
  };

export type ServicePackagePlanActivityFilter = "all" | "active" | "inactive";