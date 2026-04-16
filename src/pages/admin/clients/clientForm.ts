export type ManualClientForm = {
  name: string;
  phone: string;
  email: string;
  source: string;
};

export const initialForm: ManualClientForm = {
  name: "",
  phone: "",
  email: "",
  source: "",
};