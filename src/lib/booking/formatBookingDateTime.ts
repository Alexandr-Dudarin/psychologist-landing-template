export function formatBookingDate(
  dateString: string,
  locale: string,
  timezone: string
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(dateString));
}

export function formatBookingTime(
  dateString: string,
  locale: string,
  timezone: string
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}