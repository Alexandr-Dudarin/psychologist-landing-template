import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCalendarDatesMeta,
  formatDateLabel,
  formatPrice,
  getInitialVisibleMonth,
  getPreferredContactFallback,
  getSelectedService,
  getServiceFromPackage,
  getServiceFromPackagePlan,
  splitClientName,
  validateForm,
} from "../../src/pages/book/bookingPage.helpers";
import { initialFormState } from "../../src/pages/book/bookingPage.types";
import type {
  BookingContent,
  BookingFormState,
  BookingPageCopy,
} from "../../src/pages/book/bookingPage.types";
import {
  createPublicBooking,
  getPublicBookingAvailability,
  lookupPublicBookingPackage,
} from "../../src/lib/api/publicBooking";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingCreatePayload,
  PublicBookingPackageInfo,
  PublicBookingService,
} from "../../src/types/booking";
import type { PublicPricingPackagePlan } from "../../src/lib/services/getPublicPricingServices";

const bookingContent = {
  messages: {
    firstNameError: "First name is required",
    lastNameError: "Last name is required",
    phoneEmptyError: "Phone is required",
    emailEmptyError: "Email is required",
    emailInvalidError: "Email is invalid",
    consentError: "Consent is required",
  },
} as BookingContent;

const calendarCopy = {
  calendarAvailableLabel: "Available",
  calendarAvailableHint: "Slots available",
  calendarUnavailableLabel: "Unavailable",
  calendarUnavailableHint: "No slots",
  calendarDisabledLabel: "Disabled",
  calendarDisabledHint: "Outside booking window",
} as BookingPageCopy;

const service: PublicBookingService = {
  id: 7,
  title: "Individual consultation",
  description: "Online session",
  price: 5000,
  durationMinutes: 60,
};

const packageInfo: PublicBookingPackageInfo = {
  clientPackageId: 801,
  clientId: 501,
  clientName: "Irina Petrova",
  clientPhone: "+7 (999) 123-45-67",
  clientEmail: "irina@example.com",
  preferredContactMethod: "telegram",
  preferredContactValue: "@irina_test",
  code: "PKGACTIVE01",
  packageTitle: "Package of 4 consultations",
  serviceId: 7,
  serviceTitle: "Individual consultation",
  serviceDurationMinutes: 60,
  totalSessions: 4,
  usedSessions: 1,
  remainingSessions: 3,
};

const packagePlan: PublicPricingPackagePlan = {
  id: "package-42",
  packagePlanId: 42,
  serviceId: 7,
  serviceTitle: "Individual consultation",
  serviceDurationMinutes: 60,
  title: "Package of 4 consultations",
  description: "Four meetings",
  sessionsCount: 4,
  price: 18000,
};

const availabilityResponse: PublicBookingAvailabilityResponse = {
  services: [service],
  timezone: "Europe/Moscow",
  selectedServiceId: 7,
  selectedDate: "2026-04-20",
  visibleMonth: "2026-04",
  dateBounds: {
    min: "2026-04-01",
    max: "2026-05-31",
  },
  slotStepMinutes: 30,
  slots: [
    {
      startsAt: "2026-04-20T09:00:00.000Z",
      endsAt: "2026-04-20T10:00:00.000Z",
      startTime: "12:00",
      endTime: "13:00",
    },
  ],
  monthAvailability: [
    {
      date: "2026-04-20",
      state: "available",
      slotCount: 2,
    },
  ],
};

function validForm(overrides: Partial<BookingFormState> = {}): BookingFormState {
  return {
    ...initialFormState,
    firstName: "Irina",
    lastName: "Petrova",
    phone: "+7 (999) 123-45-67",
    email: "irina@example.com",
    preferredContactMethod: "telegram",
    preferredContactValue: "@irina_test",
    consent: true,
    ...overrides,
  };
}

describe("booking page helper contracts", () => {
  it("formats date and price labels with stable fallbacks", () => {
    expect(formatDateLabel("2026-04-20", "en")).toBe("Monday, April 20");
    expect(formatDateLabel("bad-date", "en")).toBe("bad-date");
    expect(formatPrice(5000, "en")).toContain("5,000");
    expect(formatPrice(5000, "ru").replace(/\s/g, " ")).toContain("5 000");
  });

  it("selects a service by id and returns null for empty selections", () => {
    expect(getSelectedService([service], 7)).toEqual(service);
    expect(getSelectedService([service], 999)).toBeNull();
    expect(getSelectedService([service], null)).toBeNull();
  });

  it("resolves the initial visible month from selected date, response or current date", () => {
    expect(getInitialVisibleMonth(availabilityResponse, "2026-05-10")).toBe(
      "2026-05"
    );
    expect(getInitialVisibleMonth(availabilityResponse, "")).toBe("2026-04");
    expect(
      getInitialVisibleMonth(
        {
          ...availabilityResponse,
          selectedDate: null,
          dateBounds: {
            ...availabilityResponse.dateBounds,
            min: "2026-06-01",
          },
        },
        ""
      )
    ).toBe("2026-06");
    expect(getInitialVisibleMonth(null, "")).toMatch(/^\d{4}-\d{2}$/);
  });

  it("maps month availability into calendar date meta", () => {
    expect(
      buildCalendarDatesMeta({
        copy: calendarCopy,
        monthAvailability: [
          { date: "2026-04-20", state: "available", slotCount: 2 },
          { date: "2026-04-21", state: "available", slotCount: 0 },
          { date: "2026-04-22", state: "unavailable" },
          { date: "2026-04-23", state: "disabled" },
        ],
      })
    ).toEqual([
      {
        date: "2026-04-20",
        state: "available",
        label: "Available",
        hint: "Slots available",
        badge: "2",
      },
      {
        date: "2026-04-21",
        state: "available",
        label: "Available",
        hint: "Slots available",
        badge: undefined,
      },
      {
        date: "2026-04-22",
        state: "unavailable",
        label: "Unavailable",
        hint: "No slots",
      },
      {
        date: "2026-04-23",
        state: "disabled",
        label: "Disabled",
        hint: "Outside booking window",
      },
    ]);
  });

  it("maps verified package info into the /book service summary shape", () => {
    expect(getServiceFromPackage(packageInfo)).toEqual({
      id: 7,
      title: "Individual consultation",
      description: "",
      price: 0,
      durationMinutes: 60,
    });
  });

  it("maps package plan into the /book package purchase service summary shape", () => {
    expect(getServiceFromPackagePlan(packagePlan)).toEqual({
      id: 7,
      title: "Package of 4 consultations",
      description: "Four meetings",
      price: 18000,
      durationMinutes: 60,
    });

    expect(
      getServiceFromPackagePlan({
        ...packagePlan,
        description: undefined,
      })
    ).toMatchObject({
      description: "",
    });
  });

  it("splits and normalizes client names for package booking prefill", () => {
    expect(splitClientName("  Irina   Maria   Petrova  ")).toEqual({
      firstName: "Irina",
      lastName: "Maria Petrova",
    });
    expect(splitClientName("Single")).toEqual({
      firstName: "Single",
      lastName: "",
    });
    expect(splitClientName("   ")).toEqual({
      firstName: "",
      lastName: "",
    });
  });

  it("prefers package preferred contact and falls back to entered contact", () => {
    expect(getPreferredContactFallback(packageInfo, "+7 999 000-00-00")).toEqual({
      preferredContactMethod: "telegram",
      preferredContactValue: "@irina_test",
    });
    expect(
      getPreferredContactFallback(
        {
          ...packageInfo,
          preferredContactMethod: "",
          preferredContactValue: "",
        },
        " package-owner@example.com "
      )
    ).toEqual({
      preferredContactMethod: "email",
      preferredContactValue: "package-owner@example.com",
    });
    expect(
      getPreferredContactFallback(
        {
          ...packageInfo,
          preferredContactMethod: "",
          preferredContactValue: "",
        },
        "+7 (900) 000-00-00"
      )
    ).toEqual({
      preferredContactMethod: "whatsapp",
      preferredContactValue: "+7 (900) 000-00-00",
    });
    expect(
      getPreferredContactFallback(
        {
          ...packageInfo,
          preferredContactMethod: "",
          preferredContactValue: "",
        },
        "   "
      )
    ).toEqual({
      preferredContactMethod: "",
      preferredContactValue: "",
    });
  });
});

describe("booking page validation helpers", () => {
  it("returns no errors for a valid booking form", () => {
    expect(
      validateForm(validForm(), bookingContent, {
        enabled: true,
        required: true,
      })
    ).toEqual({});
  });

  it("validates required identity, email, phone and consent fields", () => {
    expect(
      validateForm(
        validForm({
          firstName: " ",
          lastName: "",
          phone: "",
          email: "invalid-email",
          consent: false,
        }),
        bookingContent,
        {
          enabled: false,
          required: false,
        }
      )
    ).toMatchObject({
      firstName: "First name is required",
      lastName: "Last name is required",
      phone: "Phone is required",
      email: "Email is invalid",
      consent: "Consent is required",
    });
  });

  it("validates Russian phone prefix and length according to current helper logic", () => {
    expect(
      validateForm(validForm({ phone: "+1 555 123 4567" }), bookingContent, {
        enabled: false,
        required: false,
      }).phone
    ).toContain("+7");
    expect(
      validateForm(validForm({ phone: "+7 999" }), bookingContent, {
        enabled: false,
        required: false,
      }).phone
    ).toContain("10");
  });

  it("respects preferred contact enabled/required settings", () => {
    expect(
      validateForm(
        validForm({
          preferredContactMethod: "",
          preferredContactValue: "",
        }),
        bookingContent,
        {
          enabled: true,
          required: true,
        }
      )
    ).toMatchObject({
      preferredContactMethod: expect.any(String),
    });

    expect(
      validateForm(
        validForm({
          preferredContactMethod: "",
          preferredContactValue: "",
        }),
        bookingContent,
        {
          enabled: true,
          required: false,
        }
      )
    ).toEqual({});

    expect(
      validateForm(
        validForm({
          preferredContactMethod: "email",
          preferredContactValue: "not-email",
        }),
        bookingContent,
        {
          enabled: true,
          required: false,
        }
      )
    ).toMatchObject({
      preferredContactValue: expect.any(String),
    });
  });
});

describe("public booking client API helper", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads availability from the current endpoint URL with query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => availabilityResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getPublicBookingAvailability({
        serviceId: 7,
        date: "2026-04-20",
        month: "2026-04",
      })
    ).resolves.toEqual(availabilityResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/booking?serviceId=7&date=2026-04-20&month=2026-04"
    );
  });

  it("loads availability without query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => availabilityResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    await getPublicBookingAvailability();

    expect(fetchMock).toHaveBeenCalledWith("/api/public/booking");
  });

  it("throws response availability error or fallback malformed-response error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Availability unavailable" }),
      })
    );

    await expect(getPublicBookingAvailability()).rejects.toThrow(
      "Availability unavailable"
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("bad json");
        },
      })
    );

    await expect(getPublicBookingAvailability()).rejects.toThrow(
      "Не удалось загрузить доступность"
    );
  });

  it("uses the current malformed ok response contract for availability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      })
    );

    await expect(getPublicBookingAvailability()).resolves.toBeNull();
  });

  it("looks up a package and preserves non-ok code/status details", async () => {
    const successResponse = {
      success: true,
      package: packageInfo,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => successResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Package not found",
          code: "package_not_found",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      lookupPublicBookingPackage({
        code: "PKGACTIVE01",
        contact: "irina@example.com",
      })
    ).resolves.toEqual(successResponse);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/public/booking?action=lookup-package",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "PKGACTIVE01",
          contact: "irina@example.com",
        }),
      }
    );

    await expect(
      lookupPublicBookingPackage({
        code: "missing",
        contact: "irina@example.com",
      })
    ).rejects.toMatchObject({
      message: "Package not found",
      code: "package_not_found",
      status: 404,
    });
  });

  it("creates a public booking with the current payload shape", async () => {
    const payload: PublicBookingCreatePayload = {
      serviceId: 7,
      startsAt: "2026-04-20T09:00:00.000Z",
      firstName: "Irina",
      lastName: "Petrova",
      phone: "+7 (999) 123-45-67",
      email: "irina@example.com",
      preferredContactMethod: "telegram",
      preferredContactValue: "@irina_test",
      clientPackageCode: "PKGACTIVE01",
      clientPackageContact: "irina@example.com",
      message: "Package booking",
      consent: true,
    };
    const createResponse = {
      success: true,
      booking: {
        sessionId: 901,
        clientId: 501,
        serviceId: 7,
        serviceTitle: "Individual consultation",
        startsAt: "2026-04-20T09:00:00.000Z",
        endsAt: "2026-04-20T10:00:00.000Z",
        clientPackage: {
          id: 801,
          code: "PKGACTIVE01",
          packageTitle: "Package of 4 consultations",
          remainingSessions: 2,
        },
      },
      alreadyExistedClient: true,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(createPublicBooking(payload)).resolves.toEqual(createResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/booking?action=create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
  });

  it("preserves booking create error code/status and propagates network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Selected slot is unavailable",
          code: "slot_unavailable",
        }),
      })
    );

    await expect(
      createPublicBooking({
        serviceId: 7,
        startsAt: "2026-04-20T09:00:00.000Z",
        firstName: "Irina",
        lastName: "Petrova",
        phone: "+7 (999) 123-45-67",
        email: "irina@example.com",
        consent: true,
      })
    ).rejects.toMatchObject({
      message: "Selected slot is unavailable",
      code: "slot_unavailable",
      status: 409,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    await expect(getPublicBookingAvailability()).rejects.toThrow("network down");
  });
});
