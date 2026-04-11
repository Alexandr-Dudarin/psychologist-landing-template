export const siteSettings = {
  defaultLanguage: "ru" as const,
  showLanguageSwitcher: true,

  defaultTheme: "light" as const,
  showThemeSwitcher: true,

  analytics: {
    enabled: false,
  },

  crm: {
    enabled: false,
  },

  booking: {
    mode: "request_only" as "request_only" | "slot_request" | "paid_booking",
    separatePageEnabled: false,
    calendarEnabled: false,
    paymentEnabled: false,
    sessionDurationMinutes: 60,
    breakBetweenSessionsMinutes: 30,
  },
};