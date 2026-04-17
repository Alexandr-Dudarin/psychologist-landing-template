export const clientStatuses = ["active", "inactive"] as const;

export type ClientStatus = (typeof clientStatuses)[number];

export type CrmClientRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
  firstRequestId: number | null;
  createdAt: string;
};

export type CreateManualClientPayload = {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
};

export type UpdateClientPayload = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
};