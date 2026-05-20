export type CrmServiceRecord = {
  id: number;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  sessionsCount: number;
  createdAt: string;
};

export type CreateServicePayload = {
  title: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive?: boolean;
};

export type UpdateServicePayload = {
  id: number;
  title: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
};

export type CrmServicePackagePlanRecord = {
  id: number;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  serviceIsActive: boolean;
  title: string;
  description: string;
  sessionsCount: number;
  price: number;
  clientPackagesCount: number;
  isActive: boolean;
  createdAt: string;
};

export type PublicServicePackagePlanRecord = {
  id: number;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  title: string;
  description: string;
  sessionsCount: number;
  price: number;
};

export type CreateServicePackagePlanPayload = {
  serviceId: number;
  title: string;
  description?: string;
  sessionsCount: number;
  price: number;
  isActive?: boolean;
};

export type UpdateServicePackagePlanPayload = {
  id: number;
  serviceId: number;
  title: string;
  description?: string;
  sessionsCount: number;
  price: number;
  isActive: boolean;
};