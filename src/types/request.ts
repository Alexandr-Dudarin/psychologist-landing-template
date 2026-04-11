export type PublicRequestPayload = {
  name: string;
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

export type CrmRequestRecord = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  source: string;
  createdAt: string;
};