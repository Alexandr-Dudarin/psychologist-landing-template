import { getBookingTimezoneMeta } from "./bookingTimezones";

export function getTimezoneLabel(timezone: string, language: "ru" | "en") {
  const meta = getBookingTimezoneMeta(timezone);

  if (language === "ru") {
    return `${meta.labelRu} (${meta.value})`;
  }

  return `${meta.labelEn} (${meta.value})`;
}
