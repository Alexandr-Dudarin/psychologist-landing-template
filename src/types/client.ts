import type { PreferredContactMethod } from "./preferredContact.js";

export const clientStatuses = ["active", "inactive"] as const;

export type ClientStatus = (typeof clientStatuses)[number];

export const clientFavoriteFilters = ["all", "favorites"] as const;

export type ClientFavoriteFilter = (typeof clientFavoriteFilters)[number];

export const clientServicePackageStatuses = [
  "active",
  "used",
  "cancelled",
] as const;

export type ClientServicePackageStatus =
  (typeof clientServicePackageStatuses)[number];

export type CrmClientRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
  isFavorite: boolean;
  hasActivePackages: boolean;
  preferredContactMethod: PreferredContactMethod | null;
  preferredContactValue: string | null;
  firstRequestId: number | null;
  createdAt: string;
};

export type CreateManualClientPayload = {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  preferredContactMethod?: PreferredContactMethod | "";
  preferredContactValue?: string;
};

export type UpdateClientPayload = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
  preferredContactMethod?: PreferredContactMethod | "";
  preferredContactValue?: string;
};

export type CrmClientServicePackageRecord = {
  id: number;
  clientId: number;
  clientName: string;
  packagePlanId: number;
  packageTitle: string;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  price: number;
  code: string;
  status: ClientServicePackageStatus;
  createdAt: string;
};

export type AssignClientServicePackagePayload = {
  clientId: number;
  packagePlanId: number;
};