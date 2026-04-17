import type { ClientStatus, CrmClientRecord } from "../../../types/client";

export type ClientForm = {
  name: string;
  phone: string;
  email: string;
  source: string;
  status: ClientStatus;
};

export type ManualClientForm = ClientForm;

export const initialForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  source: "",
  status: "active",
};

export function mapClientToForm(client: CrmClientRecord): ClientForm {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    source: client.source,
    status: client.status,
  };
}