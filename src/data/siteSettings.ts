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

  sections: {
    education: {
      enabled: true,
      documentsEnabled: false,
    },
    contacts: {
      socialLinksEnabled: true,
    },
  },

  pricing: {
    source: "config" as "config" | "database",
  },

  booking: {
    mode: "slot_request" as "request_only" | "slot_request" | "paid_booking",
    entryMode: "separate_page" as "inline_form" | "separate_page",
    separatePageEnabled: true,
    calendarEnabled: false,
    paymentEnabled: false,
    sessionDurationMinutes: 60,
    breakBetweenSessionsMinutes: 30,
    floatingCta: {
      enabled: true,
      revealMode: "after_scroll" as "immediate" | "after_scroll",
      scrollOffsetPx: 80,
    },
  },
};
