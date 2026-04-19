import { siteSettings } from "../../data/siteSettings";

export function isSeparateBookingPageEnabled() {
  return (
    siteSettings.crm.enabled &&
    siteSettings.booking.separatePageEnabled &&
    siteSettings.booking.mode !== "request_only"
  );
}

export function getBookingTarget() {
  return isSeparateBookingPageEnabled() ? "/book" : "#booking";
}