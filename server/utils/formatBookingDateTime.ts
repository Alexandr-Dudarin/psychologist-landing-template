export function formatBookingDate(
  dateString: string,
  timezone: string
) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: timezone,
    day: "numeric",
    month: "long",
  }).format(new Date(dateString));
}

export function formatBookingTimeRange(
  startsAt: string,
  endsAt: string,
  timezone: string
) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}