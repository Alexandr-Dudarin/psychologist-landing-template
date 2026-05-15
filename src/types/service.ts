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