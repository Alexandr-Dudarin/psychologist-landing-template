import type { LocaleData } from "../../data/i18n";
import type { PublicBookingCreateSuccessResponse } from "../../types/booking";

export type BookingPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  serviceTitle: string;
  serviceHint: string;
  serviceEmpty: string;
  dateTitle: string;
  dateHint: string;
  dateLabel: string;
  dateEmpty: string;
  slotsTitle: string;
  slotsHint: string;
  slotsEmptySelection: string;
  slotsEmpty: string;
  loading: string;
  loadingCalendar: string;
  errorFallback: string;
  summaryTitle: string;
  summaryService: string;
  summaryDate: string;
  summarySlot: string;
  summaryWaiting: string;
  summaryFootnote: string;
  duration: string;
  durationUnit: string;
  price: string;
  formTitle: string;
  formHint: string;
  formDisabled: string;
  submitIdle: string;
  submitLoading: string;
  submitSuccess: string;
  submitConflict: string;
  submitErrorFallback: string;
  confirmationTitle: string;
  confirmationText: string;
  calendarAvailableLabel: string;
  calendarAvailableHint: string;
  calendarUnavailableLabel: string;
  calendarUnavailableHint: string;
  calendarDisabledLabel: string;
  calendarDisabledHint: string;
};

export type BookingFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

export type BookingFormErrors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  consent?: string;
};

export type BookingContent = LocaleData["content"]["booking"];

export const initialFormState: BookingFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  message: "",
  consent: false,
};

export type ConfirmedBooking = PublicBookingCreateSuccessResponse["booking"];
