import type { PreferredContactMethod } from "./preferredContact.js";

export const clientStatuses = ["active", "inactive"] as const;

export type ClientStatus = (typeof clientStatuses)[number];

export type CrmClientRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
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
