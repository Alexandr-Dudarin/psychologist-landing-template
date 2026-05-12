import { siteSettings } from "../../data/siteSettings.js";

type BookingTimezoneGroup =
  | "europe"
  | "russia-cis"
  | "middle-east"
  | "asia"
  | "australia-oceania"
  | "north-america"
  | "south-america";

type BookingTimezoneDefinition = {
  value: string;
  group: BookingTimezoneGroup;
  labelRu: string;
  labelEn: string;
};

const bookingTimezoneDefinitions = [
  { value: "Europe/London", group: "europe", labelRu: "Лондон, Великобритания", labelEn: "London, United Kingdom" },
  { value: "Europe/Dublin", group: "europe", labelRu: "Дублин, Ирландия", labelEn: "Dublin, Ireland" },
  { value: "Europe/Lisbon", group: "europe", labelRu: "Лиссабон, Португалия", labelEn: "Lisbon, Portugal" },
  { value: "Europe/Madrid", group: "europe", labelRu: "Мадрид, Испания", labelEn: "Madrid, Spain" },
  { value: "Europe/Paris", group: "europe", labelRu: "Париж, Франция", labelEn: "Paris, France" },
  { value: "Europe/Berlin", group: "europe", labelRu: "Берлин, Германия", labelEn: "Berlin, Germany" },
  { value: "Europe/Rome", group: "europe", labelRu: "Рим, Италия", labelEn: "Rome, Italy" },
  { value: "Europe/Amsterdam", group: "europe", labelRu: "Амстердам, Нидерланды", labelEn: "Amsterdam, Netherlands" },
  { value: "Europe/Brussels", group: "europe", labelRu: "Брюссель, Бельгия", labelEn: "Brussels, Belgium" },
  { value: "Europe/Zurich", group: "europe", labelRu: "Цюрих, Швейцария", labelEn: "Zurich, Switzerland" },
  { value: "Europe/Vienna", group: "europe", labelRu: "Вена, Австрия", labelEn: "Vienna, Austria" },
  { value: "Europe/Prague", group: "europe", labelRu: "Прага, Чехия", labelEn: "Prague, Czechia" },
  { value: "Europe/Warsaw", group: "europe", labelRu: "Варшава, Польша", labelEn: "Warsaw, Poland" },
  { value: "Europe/Athens", group: "europe", labelRu: "Афины, Греция", labelEn: "Athens, Greece" },
  { value: "Europe/Bucharest", group: "europe", labelRu: "Бухарест, Румыния", labelEn: "Bucharest, Romania" },
  { value: "Europe/Helsinki", group: "europe", labelRu: "Хельсинки, Финляндия", labelEn: "Helsinki, Finland" },
  { value: "Europe/Istanbul", group: "europe", labelRu: "Стамбул, Турция", labelEn: "Istanbul, Turkey" },
  { value: "Europe/Kyiv", group: "europe", labelRu: "Киев, Украина", labelEn: "Kyiv, Ukraine" },
  { value: "Europe/Riga", group: "europe", labelRu: "Рига, Латвия", labelEn: "Riga, Latvia" },
  { value: "Europe/Vilnius", group: "europe", labelRu: "Вильнюс, Литва", labelEn: "Vilnius, Lithuania" },
  { value: "Europe/Tallinn", group: "europe", labelRu: "Таллин, Эстония", labelEn: "Tallinn, Estonia" },

  { value: "Europe/Kaliningrad", group: "russia-cis", labelRu: "Калининград, Россия", labelEn: "Kaliningrad, Russia" },
  { value: "Europe/Moscow", group: "russia-cis", labelRu: "Москва, Россия", labelEn: "Moscow, Russia" },
  { value: "Europe/Samara", group: "russia-cis", labelRu: "Самара, Россия", labelEn: "Samara, Russia" },
  { value: "Asia/Yekaterinburg", group: "russia-cis", labelRu: "Екатеринбург, Россия", labelEn: "Yekaterinburg, Russia" },
  { value: "Asia/Omsk", group: "russia-cis", labelRu: "Омск, Россия", labelEn: "Omsk, Russia" },
  { value: "Asia/Krasnoyarsk", group: "russia-cis", labelRu: "Красноярск, Россия", labelEn: "Krasnoyarsk, Russia" },
  { value: "Asia/Irkutsk", group: "russia-cis", labelRu: "Иркутск, Россия", labelEn: "Irkutsk, Russia" },
  { value: "Asia/Yakutsk", group: "russia-cis", labelRu: "Якутск, Россия", labelEn: "Yakutsk, Russia" },
  { value: "Asia/Vladivostok", group: "russia-cis", labelRu: "Владивосток, Россия", labelEn: "Vladivostok, Russia" },
  { value: "Asia/Magadan", group: "russia-cis", labelRu: "Магадан, Россия", labelEn: "Magadan, Russia" },
  { value: "Asia/Kamchatka", group: "russia-cis", labelRu: "Камчатка, Россия", labelEn: "Kamchatka, Russia" },
  { value: "Asia/Tomsk", group: "russia-cis", labelRu: "Томск, Россия", labelEn: "Tomsk, Russia" },
  { value: "Asia/Almaty", group: "russia-cis", labelRu: "Алматы, Казахстан", labelEn: "Almaty, Kazakhstan" },
  { value: "Asia/Tashkent", group: "russia-cis", labelRu: "Ташкент, Узбекистан", labelEn: "Tashkent, Uzbekistan" },
  { value: "Asia/Baku", group: "russia-cis", labelRu: "Баку, Азербайджан", labelEn: "Baku, Azerbaijan" },
  { value: "Asia/Tbilisi", group: "russia-cis", labelRu: "Тбилиси, Грузия", labelEn: "Tbilisi, Georgia" },
  { value: "Asia/Yerevan", group: "russia-cis", labelRu: "Ереван, Армения", labelEn: "Yerevan, Armenia" },

  { value: "Asia/Jerusalem", group: "middle-east", labelRu: "Иерусалим, Израиль", labelEn: "Jerusalem, Israel" },
  { value: "Asia/Dubai", group: "middle-east", labelRu: "Дубай, ОАЭ", labelEn: "Dubai, UAE" },
  { value: "Asia/Riyadh", group: "middle-east", labelRu: "Эр-Рияд, Саудовская Аравия", labelEn: "Riyadh, Saudi Arabia" },
  { value: "Asia/Qatar", group: "middle-east", labelRu: "Доха, Катар", labelEn: "Doha, Qatar" },
  { value: "Asia/Kuwait", group: "middle-east", labelRu: "Кувейт, Кувейт", labelEn: "Kuwait City, Kuwait" },

  { value: "Asia/Karachi", group: "asia", labelRu: "Карачи, Пакистан", labelEn: "Karachi, Pakistan" },
  { value: "Asia/Kolkata", group: "asia", labelRu: "Колката, Индия", labelEn: "Kolkata, India" },
  { value: "Asia/Dhaka", group: "asia", labelRu: "Дакка, Бангладеш", labelEn: "Dhaka, Bangladesh" },
  { value: "Asia/Bangkok", group: "asia", labelRu: "Бангкок, Таиланд", labelEn: "Bangkok, Thailand" },
  { value: "Asia/Jakarta", group: "asia", labelRu: "Джакарта, Индонезия", labelEn: "Jakarta, Indonesia" },
  { value: "Asia/Singapore", group: "asia", labelRu: "Сингапур", labelEn: "Singapore" },
  { value: "Asia/Kuala_Lumpur", group: "asia", labelRu: "Куала-Лумпур, Малайзия", labelEn: "Kuala Lumpur, Malaysia" },
  { value: "Asia/Manila", group: "asia", labelRu: "Манила, Филиппины", labelEn: "Manila, Philippines" },
  { value: "Asia/Hong_Kong", group: "asia", labelRu: "Гонконг", labelEn: "Hong Kong" },
  { value: "Asia/Shanghai", group: "asia", labelRu: "Шанхай, Китай", labelEn: "Shanghai, China" },
  { value: "Asia/Taipei", group: "asia", labelRu: "Тайбэй, Тайвань", labelEn: "Taipei, Taiwan" },
  { value: "Asia/Seoul", group: "asia", labelRu: "Сеул, Южная Корея", labelEn: "Seoul, South Korea" },
  { value: "Asia/Tokyo", group: "asia", labelRu: "Токио, Япония", labelEn: "Tokyo, Japan" },

  { value: "Australia/Perth", group: "australia-oceania", labelRu: "Перт, Австралия", labelEn: "Perth, Australia" },
  { value: "Australia/Adelaide", group: "australia-oceania", labelRu: "Аделаида, Австралия", labelEn: "Adelaide, Australia" },
  { value: "Australia/Sydney", group: "australia-oceania", labelRu: "Сидней, Австралия", labelEn: "Sydney, Australia" },
  { value: "Australia/Brisbane", group: "australia-oceania", labelRu: "Брисбен, Австралия", labelEn: "Brisbane, Australia" },
  { value: "Pacific/Auckland", group: "australia-oceania", labelRu: "Окленд, Новая Зеландия", labelEn: "Auckland, New Zealand" },

  { value: "America/St_Johns", group: "north-america", labelRu: "Сент-Джонс, Канада", labelEn: "St. John's, Canada" },
  { value: "America/Halifax", group: "north-america", labelRu: "Галифакс, Канада", labelEn: "Halifax, Canada" },
  { value: "America/Toronto", group: "north-america", labelRu: "Торонто, Канада", labelEn: "Toronto, Canada" },
  { value: "America/New_York", group: "north-america", labelRu: "Нью-Йорк, США", labelEn: "New York, USA" },
  { value: "America/Chicago", group: "north-america", labelRu: "Чикаго, США", labelEn: "Chicago, USA" },
  { value: "America/Denver", group: "north-america", labelRu: "Денвер, США", labelEn: "Denver, USA" },
  { value: "America/Phoenix", group: "north-america", labelRu: "Финикс, США", labelEn: "Phoenix, USA" },
  { value: "America/Los_Angeles", group: "north-america", labelRu: "Лос-Анджелес, США", labelEn: "Los Angeles, USA" },
  { value: "America/Anchorage", group: "north-america", labelRu: "Анкоридж, США", labelEn: "Anchorage, USA" },
  { value: "Pacific/Honolulu", group: "north-america", labelRu: "Гонолулу, США", labelEn: "Honolulu, USA" },

  { value: "America/Sao_Paulo", group: "south-america", labelRu: "Сан-Паулу, Бразилия", labelEn: "Sao Paulo, Brazil" },
  { value: "America/Argentina/Buenos_Aires", group: "south-america", labelRu: "Буэнос-Айрес, Аргентина", labelEn: "Buenos Aires, Argentina" },
  { value: "America/Santiago", group: "south-america", labelRu: "Сантьяго, Чили", labelEn: "Santiago, Chile" },
  { value: "America/Bogota", group: "south-america", labelRu: "Богота, Колумбия", labelEn: "Bogota, Colombia" },
  { value: "America/Lima", group: "south-america", labelRu: "Лима, Перу", labelEn: "Lima, Peru" },
  { value: "America/Mexico_City", group: "south-america", labelRu: "Мехико, Мексика", labelEn: "Mexico City, Mexico" },
] as const satisfies readonly BookingTimezoneDefinition[];

export type BookingTimezone = (typeof bookingTimezoneDefinitions)[number]["value"];

type BookingTimezoneMeta = {
  value: BookingTimezone;
  group: BookingTimezoneGroup;
  labelRu: string;
  labelEn: string;
};

type BookingTimezoneOption = {
  value: BookingTimezone;
  label: string;
};

type BookingTimezoneOptionGroup = {
  label: string;
  options: BookingTimezoneOption[];
};

const defaultTimezone: BookingTimezone = "Europe/Moscow";

const bookingTimezoneGroupLabels: Record<
  BookingTimezoneGroup,
  { ru: string; en: string }
> = {
  "russia-cis": { ru: "Россия, СНГ и рядом", en: "Russia, CIS and nearby" },
  europe: { ru: "Европа", en: "Europe" },
  "middle-east": { ru: "Ближний Восток", en: "Middle East" },
  asia: { ru: "Азия", en: "Asia" },
  "australia-oceania": { ru: "Австралия и Океания", en: "Australia and Oceania" },
  "north-america": { ru: "Северная Америка", en: "North America" },
  "south-america": { ru: "Латинская Америка", en: "Latin America" },
};

export const bookingTimezoneValues = bookingTimezoneDefinitions.map(
  (definition) => definition.value
) as BookingTimezone[];

const bookingTimezoneMetaByValue = Object.fromEntries(
  bookingTimezoneDefinitions.map((definition) => [
    definition.value,
    {
      value: definition.value,
      group: definition.group,
      labelRu: definition.labelRu,
      labelEn: definition.labelEn,
    },
  ])
) as Record<BookingTimezone, BookingTimezoneMeta>;

function formatTimezoneLabel(meta: BookingTimezoneMeta, language: "ru" | "en") {
  const locationLabel = language === "ru" ? meta.labelRu : meta.labelEn;
  return `${locationLabel} (${meta.value})`;
}

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

    return {
      value,
      label: formatTimezoneLabel(meta, language),
    };
  });
}

export function getBookingTimezoneOptionGroups(
  language: "ru" | "en"
): BookingTimezoneOptionGroup[] {
  const groupedOptions = new Map<BookingTimezoneGroup, BookingTimezoneOption[]>();

  for (const value of bookingTimezoneValues) {
    const meta = bookingTimezoneMetaByValue[value];
    const options = groupedOptions.get(meta.group) ?? [];

    options.push({
      value,
      label: formatTimezoneLabel(meta, language),
    });

    groupedOptions.set(meta.group, options);
  }

  return (Object.keys(bookingTimezoneGroupLabels) as BookingTimezoneGroup[]).map(
    (group) => ({
      label: bookingTimezoneGroupLabels[group][language],
      options: groupedOptions.get(group) ?? [],
    })
  );
}

export function getBookingTimezoneMeta(timezone: string) {
  return bookingTimezoneMetaByValue[resolveBookingTimezone(timezone)];
}
