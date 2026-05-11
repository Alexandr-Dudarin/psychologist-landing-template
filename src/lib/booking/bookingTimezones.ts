import { siteSettings } from "../../data/siteSettings";

export const bookingTimezoneValues = [
  "Europe/Kaliningrad",
  "Europe/Moscow",
  "Europe/Samara",
  "Asia/Yekaterinburg",
  "Asia/Omsk",
  "Asia/Krasnoyarsk",
  "Asia/Irkutsk",
  "Asia/Yakutsk",
  "Asia/Vladivostok",
  "Asia/Magadan",
  "Asia/Kamchatka",
  "Asia/Tomsk",
] as const;

export type BookingTimezone = (typeof bookingTimezoneValues)[number];

type BookingTimezoneMeta = {
  value: BookingTimezone;
  labelRu: string;
  labelEn: string;
  offset: string;
};

const defaultTimezone: BookingTimezone = "Europe/Moscow";

const bookingTimezoneMetaByValue: Record<BookingTimezone, BookingTimezoneMeta> = {
  "Europe/Kaliningrad": {
    value: "Europe/Kaliningrad",
    labelRu: "Калининград",
    labelEn: "Kaliningrad",
    offset: "UTC+2",
  },
  "Europe/Moscow": {
    value: "Europe/Moscow",
    labelRu: "Москва",
    labelEn: "Moscow",
    offset: "UTC+3",
  },
  "Europe/Samara": {
    value: "Europe/Samara",
    labelRu: "Самара",
    labelEn: "Samara",
    offset: "UTC+4",
  },
  "Asia/Yekaterinburg": {
    value: "Asia/Yekaterinburg",
    labelRu: "Екатеринбург",
    labelEn: "Yekaterinburg",
    offset: "UTC+5",
  },
  "Asia/Omsk": {
    value: "Asia/Omsk",
    labelRu: "Омск",
    labelEn: "Omsk",
    offset: "UTC+6",
  },
  "Asia/Krasnoyarsk": {
    value: "Asia/Krasnoyarsk",
    labelRu: "Красноярск",
    labelEn: "Krasnoyarsk",
    offset: "UTC+7",
  },
  "Asia/Irkutsk": {
    value: "Asia/Irkutsk",
    labelRu: "Иркутск",
    labelEn: "Irkutsk",
    offset: "UTC+8",
  },
  "Asia/Yakutsk": {
    value: "Asia/Yakutsk",
    labelRu: "Якутск",
    labelEn: "Yakutsk",
    offset: "UTC+9",
  },
  "Asia/Vladivostok": {
    value: "Asia/Vladivostok",
    labelRu: "Владивосток",
    labelEn: "Vladivostok",
    offset: "UTC+10",
  },
  "Asia/Magadan": {
    value: "Asia/Magadan",
    labelRu: "Магадан",
    labelEn: "Magadan",
    offset: "UTC+11",
  },
  "Asia/Kamchatka": {
    value: "Asia/Kamchatka",
    labelRu: "Камчатка",
    labelEn: "Kamchatka",
    offset: "UTC+12",
  },
  "Asia/Tomsk": {
    value: "Asia/Tomsk",
    labelRu: "Томск",
    labelEn: "Tomsk",
    offset: "UTC+7",
  },
};

export function isBookingTimezone(value: string): value is BookingTimezone {
  return bookingTimezoneValues.includes(value as BookingTimezone);
}

export function getDefaultBookingTimezone(): BookingTimezone {
  const configuredTimezone = siteSettings.booking.timezone;

  if (isBookingTimezone(configuredTimezone)) {
    return configuredTimezone;
  }

  return defaultTimezone;
}

export function resolveBookingTimezone(
  value: string | null | undefined
): BookingTimezone {
  if (value) {
    const trimmedValue = value.trim();

    if (isBookingTimezone(trimmedValue)) {
      return trimmedValue;
    }
  }

  return getDefaultBookingTimezone();
}

export function getBookingTimezoneOptions(language: "ru" | "en") {
  return bookingTimezoneValues.map((value) => {
    const meta = bookingTimezoneMetaByValue[value];
    const cityLabel = language === "ru" ? meta.labelRu : meta.labelEn;

    return {
      value,
      label: `${cityLabel} (${meta.offset})`,
    };
  });
}

export function getBookingTimezoneMeta(timezone: string) {
  return bookingTimezoneMetaByValue[resolveBookingTimezone(timezone)];
}
