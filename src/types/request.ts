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