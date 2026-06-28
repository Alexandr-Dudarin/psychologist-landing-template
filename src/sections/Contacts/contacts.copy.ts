export type ContactsSectionCopy = {
  phoneLabel: string;
  formatLabel: string;
  socialTitleFallback: string;
  socialDescriptionFallback: string;
};

export const contactsCopyByLanguage: Record<"ru" | "en", ContactsSectionCopy> = {
  ru: {
    phoneLabel: "Телефон",
    formatLabel: "Формат",
    socialTitleFallback: "Мои соцсети",
    socialDescriptionFallback:
      "Здесь можно быстро перейти в социальные сети специалиста.",
  },
  en: {
    phoneLabel: "Phone",
    formatLabel: "Format",
    socialTitleFallback: "My social media",
    socialDescriptionFallback:
      "Here you can quickly open the specialist’s social media profiles.",
  },
};