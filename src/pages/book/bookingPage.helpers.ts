import type { CalendarDateMeta } from "../../components/calendar/calendar.types";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingMonthDayAvailability,
  PublicBookingService,
} from "../../types/booking";
import type {
  BookingContent,
  BookingFormErrors,
  BookingFormState,
  BookingPageCopy,
} from "./bookingPage.types";

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

export function validateForm(
  form: BookingFormState,
  bookingContent: BookingContent
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = bookingContent.messages.firstNameError;
  }

  if (!form.lastName.trim()) {
    errors.lastName = bookingContent.messages.lastNameError;
  }

  if (!form.phone.trim()) {
    errors.phone = bookingContent.messages.phoneEmptyError;
  } else if (form.phone.replace(/\D/g, "").length < 10) {
    errors.phone = bookingContent.messages.phoneInvalidError;
  }

  if (!form.email.trim()) {
    errors.email = bookingContent.messages.emailEmptyError;
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = bookingContent.messages.emailInvalidError;
  }

  if (!form.consent) {
    errors.consent = bookingContent.messages.consentError;
  }

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
