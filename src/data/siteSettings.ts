export const siteSettings = {
  defaultLanguage: "ru" as const,
  showLanguageSwitcher: true,

  defaultTheme: "light" as const,
  showThemeSwitcher: true,

  analytics: {
    enabled: false,
  },

  crm: {
    enabled: true,
  },

  premiumModules: {
    scheduler: {
      enabled: true,
      defaultView: "week" as "week" | "day" | "month",
    },
  },

  pricing: {
    source: "config" as "config" | "database",
  },

  booking: {
    mode: "slot_request" as "request_only" | "slot_request" | "paid_booking",
    separatePageEnabled: true,
    calendarEnabled: false,
    paymentEnabled: false,
    sessionDurationMinutes: 60,
    breakBetweenSessionsMinutes: 30,
  },
};
