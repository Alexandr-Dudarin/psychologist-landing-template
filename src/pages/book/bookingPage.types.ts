import type { LocaleData } from "../../data/i18n";
import type { PublicBookingCreateSuccessResponse } from "../../types/booking";
import type {
  PreferredContactFields,
  PreferredContactMethod,
} from "../../types/preferredContact";

export const BOOKING_MESSAGE_MAX_LENGTH = 400;

export type BookingPageCopy = {
  eyebrow: string;
  title: string;
  description: string;

  bookingModeTitle: string;
  bookingModeHint: string;
  regularBookingLabel: string;
  packageBookingLabel: string;
  packagePurchaseLabel: string;

  packageLookupTitle: string;
  packageLookupHint: string;
  packageCodeLabel: string;
  packageCodePlaceholder: string;
  packageContactLabel: string;
  packageContactPlaceholder: string;
  packageLookupButton: string;
  packageLookupLoading: string;
  packageLookupSuccessTitle: string;
  packageLookupReset: string;
  packageRemaining: string;
  packageTotal: string;
  packageService: string;
  packageReadOnlyHint: string;
  packageLookupRequiredError: string;

  packagePurchaseTitle: string;
  packagePurchaseHint: string;
  packagePurchaseEmpty: string;
  packagePurchaseButton: string;
  packagePurchaseSelectedHint: string;
  packageBaseService: string;
  packageSessionsCount: string;

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
  summaryPackage: string;
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

export type BookingFormState = PreferredContactFields & {
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
  preferredContactMethod?: string;
  preferredContactValue?: string;
  message?: string;
  consent?: string;
};

export type BookingContent = LocaleData["content"]["booking"];

export type BookingMode = "regular" | "package" | "buy-package";

export const initialFormState: BookingFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  preferredContactMethod: "" as PreferredContactMethod | "",
  preferredContactValue: "",
  message: "",
  consent: false,
};

export type ConfirmedBooking = PublicBookingCreateSuccessResponse["booking"];