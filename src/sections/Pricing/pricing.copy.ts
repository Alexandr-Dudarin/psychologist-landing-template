export type PricingCopy = {
  loading: string;
  empty: string;
  errorFallback: string;
  durationLabel: string;
  packageSectionTitle: string;
  packageSectionDescription: string;
  packageCardTitlePrefix: string;
  packageSessionsLabel: string;
  packageBaseServiceLabel: string;
  packagePerSessionLabel: string;
  packageButton: string;
};

export const pricingCopyByLanguage: Record<"ru" | "en", PricingCopy> = {
  ru: {
    loading: "Загружаем актуальные услуги...",
    empty: "Сейчас нет активных услуг для публичного прайса.",
    errorFallback: "Не удалось загрузить услуги для публичного прайса.",
    durationLabel: "мин",
    packageSectionTitle: "Пакеты консультаций",
    packageSectionDescription:
      "Можно выбрать пакет из нескольких сессий по отдельной цене. После оплаты клиент получает код, по которому сможет записываться на консультации.",
    packageCardTitlePrefix: "Пакеты:",
    packageSessionsLabel: "сессий",
    packageBaseServiceLabel: "Базовая услуга",
    packagePerSessionLabel: "≈ за сессию",
    packageButton: "Купить",
  },
  en: {
    loading: "Loading current services...",
    empty: "There are no active services for public pricing right now.",
    errorFallback: "Failed to load services for public pricing.",
    durationLabel: "min",
    packageSectionTitle: "Consultation packages",
    packageSectionDescription:
      "Choose a multi-session package at a separate price. After payment, the client receives a code to book sessions with it.",
    packageCardTitlePrefix: "Packages:",
    packageSessionsLabel: "sessions",
    packageBaseServiceLabel: "Base service",
    packagePerSessionLabel: "≈ per session",
    packageButton: "Buy",
  },
};