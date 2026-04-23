export type PublicRequestPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message?: string;
};

export type PublicRequestSuccessResponse = {
  success: true;
  telegramOk: boolean;
};

export type PublicRequestErrorResponse = {
  error: string;
  telegramOk?: boolean;
};

export const requestStatuses = [
  "new",
  "replied",
  "booked",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export type CrmRequestRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: RequestStatus;
  source: string;
  createdAt: string;
  clientId: number | null;
};

export type UpdateRequestStatusPayload = {
  id: number;
  status: RequestStatus;
};
