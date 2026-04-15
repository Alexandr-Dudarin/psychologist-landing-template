export type CrmNoteRecord = {
  id: number;
  clientId: number;
  clientName: string;
  sessionId: number | null;
  sessionScheduledAt: string | null;
  sessionServiceTitle: string | null;
  content: string;
  createdAt: string;
};

export type CreateNotePayload = {
  clientId: number;
  sessionId?: number | null;
  content: string;
};

export type UpdateNotePayload = {
  id: number;
  clientId: number;
  sessionId?: number | null;
  content: string;
};