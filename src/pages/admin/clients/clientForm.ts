import type { ClientStatus, CrmClientRecord } from "../../../types/client";
import type { PreferredContactFields } from "../../../types/preferredContact";

export type ClientForm = PreferredContactFields & {
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
  preferredContactMethod: "",
  preferredContactValue: "",
  source: "",
  status: "active",
};

export function mapClientToForm(client: CrmClientRecord): ClientForm {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    preferredContactMethod: client.preferredContactMethod ?? "",
    preferredContactValue: client.preferredContactValue ?? "",
    source: client.source,
    status: client.status,
  };
}
