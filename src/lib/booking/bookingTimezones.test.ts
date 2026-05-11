import { describe, expect, it } from "vitest";

import {
  bookingTimezoneValues,
  getBookingTimezoneOptionGroups,
  getBookingTimezoneOptions,
  getBookingTimezoneMeta,
  isBookingTimezone,
  resolveBookingTimezone,
} from "./bookingTimezones";
import { getTimezoneLabel } from "./getTimezoneLabel";

describe("booking timezones", () => {
  it("includes the new international whitelist entries", () => {
    expect(bookingTimezoneValues).toContain("Europe/Paris");
    expect(bookingTimezoneValues).toContain("Asia/Tokyo");
    expect(bookingTimezoneValues).toContain("America/New_York");
    expect(bookingTimezoneValues).toContain("Pacific/Auckland");
  });

  it("still rejects arbitrary timezone strings", () => {
    expect(isBookingTimezone("UTC")).toBe(false);
    expect(isBookingTimezone("Europe/Unknown")).toBe(false);
  });

  it("formats user-facing labels with readable location names and IANA ids", () => {
    expect(getTimezoneLabel("Europe/Paris", "ru")).toBe(
      "Париж, Франция (Europe/Paris)"
    );
    expect(getTimezoneLabel("America/New_York", "en")).toBe(
      "New York, USA (America/New_York)"
    );
  });

  it("groups admin select options by region", () => {
    const groups = getBookingTimezoneOptionGroups("ru");
    const europe = groups.find((group) => group.label === "Европа");
    const northAmerica = groups.find(
      (group) => group.label === "Северная Америка"
    );

    expect(europe?.options.some((option) => option.value === "Europe/London")).toBe(
      true
    );
    expect(
      northAmerica?.options.some(
        (option) => option.value === "America/Los_Angeles"
      )
    ).toBe(true);
  });

  it("keeps fallback resolution on unknown stored values", () => {
    expect(resolveBookingTimezone("Not/A_Real_Zone")).toBe("Europe/Moscow");
    expect(getBookingTimezoneMeta("Not/A_Real_Zone").value).toBe("Europe/Moscow");
  });

  it("returns flat options for non-grouped consumers", () => {
    const options = getBookingTimezoneOptions("en");
    expect(options.some((option) => option.value === "Asia/Singapore")).toBe(true);
  });
});
