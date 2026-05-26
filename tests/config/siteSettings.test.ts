import { describe, expect, it } from "vitest";

import { siteSettings } from "../../src/data/siteSettings";
import {
  isContactsSocialLinksEnabled,
  isContactsTelegramButtonEnabled,
  isContactsWhatsappButtonEnabled,
  isEducationDocumentsEnabled,
  isLandingInlineBookingEnabled,
  isPremiumSchedulerEnabled,
  isPricingSourceConfig,
  isPricingSourceDatabaseBacked,
  isPublicSectionEnabled,
  isSeparateBookingPageEnabledForSettings,
  isValidSchedulerDefaultView,
  type PublicSectionKey,
  type SiteSettings,
} from "../../src/lib/config/siteSettingsHelpers";

function createSettings(update?: (settings: SiteSettings) => void): SiteSettings {
  const settings = structuredClone(siteSettings) as SiteSettings;
  update?.(settings);

  return settings;
}

describe("siteSettings default contract", () => {
  it("exports the key configuration branches used by public, booking and CRM flows", () => {
    expect(siteSettings).toMatchObject({
      defaultLanguage: "ru",
      showLanguageSwitcher: true,
      defaultTheme: "light",
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
      booking: {
        entryMode: "separate_page",
        mode: "slot_request",
        separatePageEnabled: true,
        paymentEnabled: true,
        timezone: "Europe/Moscow",
      },
    });

    expect(siteSettings.sections).toEqual(
      expect.objectContaining({
        about: expect.objectContaining({ enabled: true }),
        education: expect.objectContaining({
          enabled: true,
          documentsEnabled: false,
        }),
        pricing: expect.objectContaining({ enabled: true }),
        booking: expect.objectContaining({ enabled: true }),
        contacts: expect.objectContaining({
          enabled: true,
          socialLinksEnabled: true,
          telegramButtonEnabled: true,
          whatsappButtonEnabled: true,
        }),
        faq: expect.objectContaining({ enabled: true }),
        privacy: expect.objectContaining({ enabled: true }),
        guides: expect.objectContaining({ enabled: true }),
        reviews: expect.objectContaining({ enabled: true }),
      })
    );
  });

  it("keeps pricing source and scheduler defaults in the supported value sets", () => {
    expect(["config", "database"]).toContain(siteSettings.pricingSource);
    expect(isValidSchedulerDefaultView(siteSettings.premiumModules.scheduler.defaultView)).toBe(
      true
    );
  });
});

describe("public section flags", () => {
  const publicSections: PublicSectionKey[] = [
    "about",
    "education",
    "pricing",
    "booking",
    "contacts",
    "faq",
    "privacy",
    "guides",
    "reviews",
  ];

  it("treats enabled sections as available in helper logic", () => {
    const settings = createSettings((draft) => {
      for (const section of publicSections) {
        draft.sections[section].enabled = true;
      }
    });

    for (const section of publicSections) {
      expect(isPublicSectionEnabled(section, settings)).toBe(true);
    }
  });

  it("treats disabled sections as unavailable in helper logic", () => {
    const settings = createSettings((draft) => {
      for (const section of publicSections) {
        draft.sections[section].enabled = false;
      }
    });

    for (const section of publicSections) {
      expect(isPublicSectionEnabled(section, settings)).toBe(false);
    }
  });
});

describe("booking entry mode flags", () => {
  it("does not enable inline booking when the booking section is disabled", () => {
    const settings = createSettings((draft) => {
      draft.sections.booking.enabled = false;
      draft.booking.entryMode = "inline_form";
      draft.crm.enabled = true;
      draft.booking.mode = "slot_request";
    });

    expect(isLandingInlineBookingEnabled(settings)).toBe(false);
    expect(isSeparateBookingPageEnabledForSettings(settings)).toBe(false);
  });

  it("enables inline booking only for inline_form entry mode on the landing page", () => {
    const settings = createSettings((draft) => {
      draft.sections.booking.enabled = true;
      draft.booking.entryMode = "inline_form";
      draft.crm.enabled = true;
      draft.booking.mode = "slot_request";
    });

    expect(isLandingInlineBookingEnabled(settings)).toBe(true);
    expect(isSeparateBookingPageEnabledForSettings(settings)).toBe(false);
  });

  it("hides the inline form when separate booking page mode is active", () => {
    const settings = createSettings((draft) => {
      draft.sections.booking.enabled = true;
      draft.booking.entryMode = "separate_page";
      draft.crm.enabled = true;
      draft.booking.mode = "slot_request";
    });

    expect(isSeparateBookingPageEnabledForSettings(settings)).toBe(true);
    expect(isLandingInlineBookingEnabled(settings)).toBe(false);
  });

  it("falls back to inline landing booking when CRM disables separate page mode", () => {
    const settings = createSettings((draft) => {
      draft.sections.booking.enabled = true;
      draft.booking.entryMode = "separate_page";
      draft.crm.enabled = false;
      draft.booking.mode = "slot_request";
    });

    expect(isSeparateBookingPageEnabledForSettings(settings)).toBe(false);
    expect(isLandingInlineBookingEnabled(settings)).toBe(true);
  });

  it("falls back to inline landing booking when booking mode is request_only", () => {
    const settings = createSettings((draft) => {
      draft.sections.booking.enabled = true;
      draft.booking.entryMode = "separate_page";
      draft.crm.enabled = true;
      draft.booking.mode = "request_only";
    });

    expect(isSeparateBookingPageEnabledForSettings(settings)).toBe(false);
    expect(isLandingInlineBookingEnabled(settings)).toBe(true);
  });
});

describe("pricing source flags", () => {
  it("treats config pricing as a non database-backed source", () => {
    const settings = createSettings((draft) => {
      draft.pricingSource = "config";
    });

    expect(isPricingSourceConfig(settings)).toBe(true);
    expect(isPricingSourceDatabaseBacked(settings)).toBe(false);
  });

  it("treats database pricing as CRM/API-backed source", () => {
    const settings = createSettings((draft) => {
      draft.pricingSource = "database";
    });

    expect(isPricingSourceConfig(settings)).toBe(false);
    expect(isPricingSourceDatabaseBacked(settings)).toBe(true);
  });
});

describe("contacts and education sub-flags", () => {
  it("does not let contacts sub-flags enable contact UI when contacts parent is disabled", () => {
    const settings = createSettings((draft) => {
      draft.sections.contacts.enabled = false;
      draft.sections.contacts.socialLinksEnabled = true;
      draft.sections.contacts.telegramButtonEnabled = true;
      draft.sections.contacts.whatsappButtonEnabled = true;
    });

    expect(isContactsSocialLinksEnabled(settings)).toBe(false);
    expect(isContactsTelegramButtonEnabled(settings)).toBe(false);
    expect(isContactsWhatsappButtonEnabled(settings)).toBe(false);
  });

  it("enables contacts sub-features only when parent and sub-flag are enabled", () => {
    const settings = createSettings((draft) => {
      draft.sections.contacts.enabled = true;
      draft.sections.contacts.socialLinksEnabled = true;
      draft.sections.contacts.telegramButtonEnabled = false;
      draft.sections.contacts.whatsappButtonEnabled = true;
    });

    expect(isContactsSocialLinksEnabled(settings)).toBe(true);
    expect(isContactsTelegramButtonEnabled(settings)).toBe(false);
    expect(isContactsWhatsappButtonEnabled(settings)).toBe(true);
  });

  it("does not let education documents enable themselves when education parent is disabled", () => {
    const settings = createSettings((draft) => {
      draft.sections.education.enabled = false;
      draft.sections.education.documentsEnabled = true;
    });

    expect(isEducationDocumentsEnabled(settings)).toBe(false);
  });

  it("enables education documents only when parent and documents flag are enabled", () => {
    const settings = createSettings((draft) => {
      draft.sections.education.enabled = true;
      draft.sections.education.documentsEnabled = true;
    });

    expect(isEducationDocumentsEnabled(settings)).toBe(true);
  });
});

describe("premium modules, analytics and language/theme flags", () => {
  it("reads premium scheduler availability from its enabled flag", () => {
    expect(
      isPremiumSchedulerEnabled(
        createSettings((draft) => {
          draft.premiumModules.scheduler.enabled = true;
        })
      )
    ).toBe(true);
    expect(
      isPremiumSchedulerEnabled(
        createSettings((draft) => {
          draft.premiumModules.scheduler.enabled = false;
        })
      )
    ).toBe(false);
  });

  it("validates scheduler default view values without adding runtime fallback behavior", () => {
    expect(isValidSchedulerDefaultView("week")).toBe(true);
    expect(isValidSchedulerDefaultView("day")).toBe(true);
    expect(isValidSchedulerDefaultView("month")).toBe(true);
    expect(isValidSchedulerDefaultView("agenda")).toBe(false);
  });

  it("keeps analytics disabled by default and language/theme switches explicit", () => {
    expect(siteSettings.analytics.enabled).toBe(false);
    expect(siteSettings.defaultLanguage).toBe("ru");
    expect(siteSettings.showLanguageSwitcher).toBe(true);
    expect(siteSettings.defaultTheme).toBe("light");
    expect(siteSettings.showThemeSwitcher).toBe(true);
  });
});
