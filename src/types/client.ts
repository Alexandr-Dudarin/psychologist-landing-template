export type ClientStatus = "active" | "inactive";

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