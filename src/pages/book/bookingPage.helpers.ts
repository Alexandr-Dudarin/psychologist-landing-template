import type { CalendarDateMeta } from "../../components/calendar/calendar.types";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingMonthDayAvailability,
  PublicBookingPackageInfo,
  PublicBookingService,
} from "../../types/booking";
import type {
  BookingContent,
  BookingFormErrors,
  BookingFormState,
  BookingPageCopy,
} from "./bookingPage.types";
import { validatePreferredContactFields } from "../../lib/preferredContact";
import type { PublicPricingPackagePlan } from "../../lib/services/getPublicPricingServices";

export function formatDateLabel(value: string, language: "ru" | "en") {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

export function formatPrice(value: number, language: "ru" | "en") {
  return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getSelectedService(
  services: PublicBookingService[],
  selectedServiceId: number | null
) {
  return services.find((service) => service.id === selectedServiceId) ?? null;
}

function getRussianBookingPhoneError(rawPhone: string) {
  const trimmed = rawPhone.trim();

  if (!trimmed) {
    return "empty" as const;
  }

  const digits = trimmed.replace(/\D/g, "");

  const startsWithPlusSeven =
    trimmed.startsWith("+7") && digits.startsWith("7");
  const startsWithEight =
    trimmed.startsWith("8") && digits.startsWith("8");

  if (!startsWithPlusSeven && !startsWithEight) {
    return "prefix" as const;
  }

  if (digits.length !== 11) {
    return "length" as const;
  }

  return null;
}

export function validateForm(
  form: BookingFormState,
  bookingContent: BookingContent,
  preferredContactOptions: {
    enabled: boolean;
    required: boolean;
  }
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = bookingContent.messages.firstNameError;
  }

  if (!form.lastName.trim()) {
    errors.lastName = bookingContent.messages.lastNameError;
  }

  const phoneError = getRussianBookingPhoneError(form.phone);

  if (!form.phone.trim()) {
    errors.phone = bookingContent.messages.phoneEmptyError;
  } else if (phoneError === "prefix") {
    errors.phone = "Номер должен начинаться с +7 или 8";
  } else if (phoneError === "length") {
    errors.phone = "После +7 или 8 введите ещё 10 цифр";
  }

  if (!form.email.trim()) {
    errors.email = bookingContent.messages.emailEmptyError;
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = bookingContent.messages.emailInvalidError;
  }

  if (!form.consent) {
    errors.consent = bookingContent.messages.consentError;
  }

  Object.assign(
    errors,
    validatePreferredContactFields(form, preferredContactOptions)
  );

  return errors;
}

export function getInitialVisibleMonth(
  response: PublicBookingAvailabilityResponse | null,
  selectedDate: string
): string {
  if (selectedDate) {
    return selectedDate.slice(0, 7);
  }

  if (response?.selectedDate) {
    return response.selectedDate.slice(0, 7);
  }

  if (response?.dateBounds.min) {
    return response.dateBounds.min.slice(0, 7);
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function buildCalendarDatesMeta(params: {
  monthAvailability: PublicBookingMonthDayAvailability[];
  copy: BookingPageCopy;
}): CalendarDateMeta[] {
  const { monthAvailability, copy } = params;

  return monthAvailability.map((day) => {
    if (day.state === "available") {
      return {
        date: day.date,
        state: "available",
        label: copy.calendarAvailableLabel,
        hint: copy.calendarAvailableHint,
        badge: day.slotCount ? String(day.slotCount) : undefined,
      };
    }

    if (day.state === "unavailable") {
      return {
        date: day.date,
        state: "unavailable",
        label: copy.calendarUnavailableLabel,
        hint: copy.calendarUnavailableHint,
      };
    }

    return {
      date: day.date,
      state: "disabled",
      label: copy.calendarDisabledLabel,
      hint: copy.calendarDisabledHint,
    };
  });
}

export function getServiceFromPackage(
  packageInfo: PublicBookingPackageInfo
): PublicBookingService {
  return {
    id: packageInfo.serviceId,
    title: packageInfo.serviceTitle,
    description: "",
    price: 0,
    durationMinutes: packageInfo.serviceDurationMinutes,
  };
}

export function getServiceFromPackagePlan(
  packagePlan: PublicPricingPackagePlan
): PublicBookingService {
  return {
    id: packagePlan.serviceId,
    title: packagePlan.title,
    description: packagePlan.description ?? "",
    price: packagePlan.price,
    durationMinutes: packagePlan.serviceDurationMinutes,
  };
}

export function splitClientName(fullName: string) {
  const normalizedName = fullName.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalizedName.split(" ");

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function getPreferredContactFallback(
  packageInfo: PublicBookingPackageInfo,
  packageContact: string
): Pick<BookingFormState, "preferredContactMethod" | "preferredContactValue"> {
  if (packageInfo.preferredContactMethod && packageInfo.preferredContactValue) {
    return {
      preferredContactMethod: packageInfo.preferredContactMethod,
      preferredContactValue: packageInfo.preferredContactValue,
    };
  }

  const trimmedContact = packageContact.trim();

  if (!trimmedContact) {
    return {
      preferredContactMethod: "",
      preferredContactValue: "",
    };
  }

  if (trimmedContact.includes("@")) {
    return {
      preferredContactMethod: "email",
      preferredContactValue: trimmedContact,
    };
  }

  return {
    preferredContactMethod: "whatsapp",
    preferredContactValue: trimmedContact,
  };
}
