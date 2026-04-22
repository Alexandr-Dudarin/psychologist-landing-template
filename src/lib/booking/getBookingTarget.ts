import { siteSettings } from "../../data/siteSettings";

export function getBookingEntryMode() {
  return siteSettings.booking.entryMode;
}

export function isInlineBookingFormEnabled() {
  return !isSeparateBookingPageEnabled();
}

export function isSeparateBookingPageEnabled() {
  return (
    getBookingEntryMode() === "separate_page" &&
    siteSettings.crm.enabled &&
    siteSettings.booking.mode !== "request_only"
  );
}

export function getBookingTarget() {
  return isSeparateBookingPageEnabled() ? "/book" : "#booking";
}

export function getPricingSourceMode() {
  return siteSettings.pricing.source;
}

export function canRenderFloatingBookingCta(pathname: string) {
  return (
    siteSettings.booking.floatingCta.enabled &&
    !pathname.startsWith("/admin") &&
    pathname !== "/book"
  );
}
