import { siteSettings } from "../../data/siteSettings";

type BookingTargetOptions = {
  serviceId?: number | undefined;
};

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

export function getBookingTarget(
  options: BookingTargetOptions = {}
) {
  if (!isSeparateBookingPageEnabled()) {
    return "#booking";
  }

  const { serviceId } = options;

  if (
    typeof serviceId !== "number" ||
    !Number.isInteger(serviceId) ||
    serviceId <= 0
  ) {
    return "/book";
  }

  const searchParams = new URLSearchParams({
    serviceId: String(serviceId),
  });

  return `/book?${searchParams.toString()}`;
}

export function getPricingSourceMode() {
  return siteSettings.pricingSource;
}

export function canRenderFloatingBookingCta(pathname: string) {
  const isReviewsPage = pathname === "/reviews" || pathname.startsWith("/reviews/");

  return (
    siteSettings.booking.floatingCta.enabled &&
    !pathname.startsWith("/admin") &&
    pathname !== "/book" &&
    !isReviewsPage
  );
}