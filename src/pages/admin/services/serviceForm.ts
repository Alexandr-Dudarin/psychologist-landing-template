export type ServiceForm = {
  title: string;
  description: string;
  price: string;
  durationMinutes: string;
  isActive: boolean;
};

export const initialCreateForm: ServiceForm = {
  title: "",
  description: "",
  price: "",
  durationMinutes: "60",
  isActive: true,
};

export const initialEditForm: ServiceForm = {
  title: "",
  description: "",
  price: "",
  durationMinutes: "60",
  isActive: true,
};
