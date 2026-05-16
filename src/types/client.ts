import type { PreferredContactMethod } from "./preferredContact.js";

export const clientStatuses = ["active", "inactive"] as const;

export type ClientStatus = (typeof clientStatuses)[number];

export const clientFavoriteFilters = ["all", "favorites"] as const;

export type ClientFavoriteFilter = (typeof clientFavoriteFilters)[number];

export type CrmClientRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
  isFavorite: boolean;
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