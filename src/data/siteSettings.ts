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

  preferredContactMethod: {
    enabled: true,
    required: true,
  },

  servicePackages: {
    enabled: true,
    publicPricingEnabled: true,
  },

  clientReviews: {
    enabled: true,
    publicListEnabled: true,
    publicFormEnabled: true,
    moderationEnabled: true,
    rewardCodesEnabled: false,
    prohibitedContentFilter: {
      enabled: true,
      mode: "strict" as "strict",
      maxRepeatedCharacterCount: 15,
      maxRepeatedWordCount: 10,
    },
  },

  premiumModules: {
    scheduler: {
      enabled: true,
      defaultView: "week" as "week" | "day" | "month",
    },
  },

  sections: {
    about: {
      enabled: true,
    },
    education: {
      enabled: true,
      documentsEnabled: false,
    },
    pricing: {
      enabled: true,
    },
    booking: {
      enabled: true,
    },
    contacts: {
      enabled: true,
      socialLinksEnabled: true,
      telegramButtonEnabled: true,
      whatsappButtonEnabled: true,
    },
    faq: {
      enabled: true,
    },
    privacy: {
      enabled: true,
    },
    guides: {
      enabled: true,
    },
    reviews: {
      enabled: true,
      mode: "client_reviews" as "images" | "client_reviews" | "mixed",
      imageReviewsEnabled: true,
      clientReviewsEnabled: true,
      clientReviewFormLinkEnabled: true,
    },
  },

  pricingSource: "database" as "config" | "database",

  booking: {
    mode: "slot_request" as "request_only" | "slot_request" | "paid_booking",
    entryMode: "separate_page" as "inline_form" | "separate_page",
    separatePageEnabled: true,
    calendarEnabled: false,
    paymentEnabled: true,
    timezone: "Europe/Moscow",
    sessionDurationMinutes: 60,
    breakBetweenSessionsMinutes: 30,
    floatingCta: {
      enabled: true,
      revealMode: "after_scroll" as "immediate" | "after_scroll",
      scrollOffsetPx: 80,
    },
  },
};