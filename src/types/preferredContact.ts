export const preferredContactMethods = [
  "whatsapp",
  "telegram",
  "email",
  "sms",
  "vk",
] as const;

export type PreferredContactMethod = (typeof preferredContactMethods)[number];

export type PreferredContactFields = {
  preferredContactMethod: PreferredContactMethod | "";
  preferredContactValue: string;
};
