export const sessionStatuses = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type SessionStatus = (typeof sessionStatuses)[number];

export type CrmSessionRecord = {
  id: number;
  clientId: number;
  clientName: string;
  serviceId: number;
  serviceTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  notes: string;
  source: string;
  createdAt: string;
};

export type CreateSessionPayload = {
  clientId: number;
  serviceId: number;
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  status?: SessionStatus;
  notes?: string;
  source?: string;
};