import { siteSettings } from "../../data/siteSettings";

export type SiteSettings = typeof siteSettings;
export type PublicSectionKey = keyof SiteSettings["sections"];
export type SchedulerViewMode =
  SiteSettings["premiumModules"]["scheduler"]["defaultView"];

const schedulerViewModes: SchedulerViewMode[] = ["week", "day", "month"];

export function isPublicSectionEnabled(
  section: PublicSectionKey,
  settings: SiteSettings = siteSettings
) {
  return settings.sections[section].enabled;
}

export function isSeparateBookingPageEnabledForSettings(
  settings: SiteSettings = siteSettings
) {
  return (
    settings.booking.entryMode === "separate_page" &&
    settings.crm.enabled &&
    settings.booking.mode !== "request_only"
  );
}

export function isLandingInlineBookingEnabled(
  settings: SiteSettings = siteSettings
) {
  return (
    settings.sections.booking.enabled &&
    !isSeparateBookingPageEnabledForSettings(settings)
  );
}

export function isPricingSourceConfig(settings: SiteSettings = siteSettings) {
  return settings.pricingSource === "config";
}

export function isPricingSourceDatabaseBacked(
  settings: SiteSettings = siteSettings
) {
  return settings.pricingSource === "database";
}

export function isContactsSocialLinksEnabled(
  settings: SiteSettings = siteSettings
) {
  return (
    settings.sections.contacts.enabled &&
    settings.sections.contacts.socialLinksEnabled
  );
}

export function isContactsTelegramButtonEnabled(
  settings: SiteSettings = siteSettings
) {
  return (
    settings.sections.contacts.enabled &&
    settings.sections.contacts.telegramButtonEnabled
  );
}

export function isContactsWhatsappButtonEnabled(
  settings: SiteSettings = siteSettings
) {
  return (
    settings.sections.contacts.enabled &&
    settings.sections.contacts.whatsappButtonEnabled
  );
}

export function isEducationDocumentsEnabled(
  settings: SiteSettings = siteSettings
) {
  return (
    settings.sections.education.enabled &&
    settings.sections.education.documentsEnabled
  );
}

export function isPremiumSchedulerEnabled(
  settings: SiteSettings = siteSettings
) {
  return settings.premiumModules.scheduler.enabled;
}

export function isValidSchedulerDefaultView(
  value: string
): value is SchedulerViewMode {
  return schedulerViewModes.includes(value as SchedulerViewMode);
}
