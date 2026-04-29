export function getTimezoneLabel(timezone: string, language: "ru" | "en") {
  if (language === "ru") {
    if (timezone === "Europe/Moscow") return "по московскому времени";
    if (timezone === "Asia/Tomsk") return "по томскому времени";

    return `по времени ${timezone}`;
  }

  if (timezone === "Europe/Moscow") return "Moscow time";
  if (timezone === "Asia/Tomsk") return "Tomsk time";

  return timezone;
}