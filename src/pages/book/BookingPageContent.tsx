import type { FormEvent, RefObject } from "react";
import { Link } from "react-router-dom";

import type { CalendarDateMeta } from "../../components/calendar/calendar.types";
import { Container } from "../../components/Container/Container";
import type {
  PublicBookingPackageInfo,
  PublicBookingService,
  PublicBookingSlot,
} from "../../types/booking";
import type { PublicPricingPackagePlan } from "../../lib/services/getPublicPricingServices";
import { BookingDateStep } from "./BookingDateStep";
import { BookingFormStep } from "./BookingFormStep";
import { BookingPageSkeleton } from "./BookingPageSkeleton";
import { BookingServiceStep } from "./BookingServiceStep";
import { BookingSlotsStep } from "./BookingSlotsStep";
import { BookingSummary } from "./BookingSummary";
import type {
  BookingContent,
  BookingFormErrors,
  BookingFormState,
  BookingMode,
  BookingPageCopy,
  ConfirmedBooking,
} from "./bookingPage.types";
import styles from "./BookingPage.module.css";

type BookingPageContentProps = {
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  locale: string;
  weekStartsOn: 0 | 1;
  bookingContent: BookingContent;
  privacyLinkText: string;
  isLoading: boolean;
  services: PublicBookingService[];
  packagePlans: PublicPricingPackagePlan[];
  selectedServiceId: number | null;
  selectedPackagePlanId: number | null;
  bookingMode: BookingMode;
  showPackagePurchaseMode: boolean;
  packageCode: string;
  packageContact: string;
  packageInfo: PublicBookingPackageInfo | null;
  packageLookupError: string | null;
  isLookingUpPackage: boolean;
  isPackagePurchaseMode: boolean;
  selectedService: PublicBookingService | null;
  selectedDate: string;
  visibleMonth: string;
  minDate?: string;
  maxDate?: string;
  datesMeta: CalendarDateMeta[];
  isRefreshingSlots: boolean;
  error: string | null;
  timezoneLabel: string;
  slots: PublicBookingSlot[];
  selectedSlot: PublicBookingSlot | null;
  isFormEnabled: boolean;
  form: BookingFormState;
  isCompleted: boolean;
  showPreferredContact: boolean;
  formErrors: BookingFormErrors;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  pulseSummary: boolean;
  selectedSummaryService: PublicBookingService | null;
  confirmedBooking: ConfirmedBooking | null;
  clientPackage: PublicBookingPackageInfo | null;
  bookingTimezone: string;
  dateRef: RefObject<HTMLDivElement | null>;
  slotsRef: RefObject<HTMLDivElement | null>;
  formRef: RefObject<HTMLDivElement | null>;
  onBookingModeChange: (mode: BookingMode) => void;
  onPackagePlanSelect: (packagePlanId: number) => void;
  onPackageCodeChange: (value: string) => void;
  onPackageContactChange: (value: string) => void;
  onPackageLookup: (event: FormEvent<HTMLFormElement>) => void;
  onPackageReset: () => void;
  onServiceSelect: (serviceId: number) => void;
  onDateChange: (date: string) => void;
  onVisibleMonthChange: (month: string) => void;
  onSlotSelect: (slot: PublicBookingSlot) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <Field extends keyof BookingFormState>(
    field: Field,
    value: BookingFormState[Field]
  ) => void;
};

export function BookingPageContent({
  copy,
  currentLanguage,
  locale,
  weekStartsOn,
  bookingContent,
  privacyLinkText,
  isLoading,
  services,
  packagePlans,
  selectedServiceId,
  selectedPackagePlanId,
  bookingMode,
  showPackagePurchaseMode,
  packageCode,
  packageContact,
  packageInfo,
  packageLookupError,
  isLookingUpPackage,
  isPackagePurchaseMode,
  selectedService,
  selectedDate,
  visibleMonth,
  minDate,
  maxDate,
  datesMeta,
  isRefreshingSlots,
  error,
  timezoneLabel,
  slots,
  selectedSlot,
  isFormEnabled,
  form,
  isCompleted,
  showPreferredContact,
  formErrors,
  isSubmitting,
  submitError,
  submitSuccess,
  pulseSummary,
  selectedSummaryService,
  confirmedBooking,
  clientPackage,
  bookingTimezone,
  dateRef,
  slotsRef,
  formRef,
  onBookingModeChange,
  onPackagePlanSelect,
  onPackageCodeChange,
  onPackageContactChange,
  onPackageLookup,
  onPackageReset,
  onServiceSelect,
  onDateChange,
  onVisibleMonthChange,
  onSlotSelect,
  onSubmit,
  onFieldChange,
}: BookingPageContentProps) {
  return (
    <Container>
      <div className={styles.topbar}>
        <Link to="/" className={styles.backLink}>
          {currentLanguage === "ru" ? "← Вернуться на сайт" : "← Back to site"}
        </Link>
      </div>

      <div className={styles.hero}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
      </div>

      {isLoading ? (
        <BookingPageSkeleton copy={copy} />
      ) : (
        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.stepActive}>
              <BookingServiceStep
                copy={copy}
                currentLanguage={currentLanguage}
                services={services}
                packagePlans={packagePlans}
                selectedServiceId={selectedServiceId}
                selectedPackagePlanId={selectedPackagePlanId}
                bookingMode={bookingMode}
                showPackagePurchaseMode={showPackagePurchaseMode}
                packageCode={packageCode}
                packageContact={packageContact}
                packageInfo={packageInfo}
                packageLookupError={packageLookupError}
                isLookingUpPackage={isLookingUpPackage}
                onBookingModeChange={onBookingModeChange}
                onPackagePlanSelect={onPackagePlanSelect}
                onPackageCodeChange={onPackageCodeChange}
                onPackageContactChange={onPackageContactChange}
                onPackageLookup={onPackageLookup}
                onPackageReset={onPackageReset}
                onSelect={onServiceSelect}
              />
            </div>

            {!isPackagePurchaseMode ? (
              <>
                <div
                  ref={dateRef}
                  className={
                    !selectedService ? styles.stepDisabled : styles.stepActive
                  }
                >
                  <BookingDateStep
                    copy={copy}
                    selectedService={Boolean(selectedService)}
                    selectedDate={selectedDate}
                    visibleMonth={visibleMonth}
                    minDate={minDate}
                    maxDate={maxDate}
                    datesMeta={datesMeta}
                    isRefreshingSlots={isRefreshingSlots}
                    error={error}
                    locale={locale}
                    weekStartsOn={weekStartsOn}
                    onDateChange={onDateChange}
                    onVisibleMonthChange={onVisibleMonthChange}
                  />
                </div>

                <div
                  ref={slotsRef}
                  className={
                    !selectedService || !selectedDate
                      ? styles.stepDisabled
                      : styles.stepActive
                  }
                >
                  {selectedService && selectedDate ? (
                    <div className={styles.timezoneNotice}>
                      <span
                        className={styles.timezoneIcon}
                        aria-hidden="true"
                      >
                        🕒
                      </span>

                      <span className={styles.timezoneNoticeText}>
                        {currentLanguage === "ru"
                          ? `Время указано по часовому поясу записи: ${timezoneLabel}. Пожалуйста, учитывайте это при выборе слота.`
                          : `Times are shown in the booking timezone: ${timezoneLabel}. Please keep this in mind when choosing a slot.`}
                      </span>
                    </div>
                  ) : null}

                  <BookingSlotsStep
                    copy={copy}
                    error={error}
                    selectedService={Boolean(selectedService)}
                    selectedDate={selectedDate}
                    isRefreshingSlots={isRefreshingSlots}
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelect={onSlotSelect}
                  />
                </div>
              </>
            ) : null}

            <div
              ref={formRef}
              className={!isFormEnabled ? styles.stepDisabled : styles.stepActive}
            >
              <BookingFormStep
                copy={copy}
                bookingContent={bookingContent}
                privacyLinkText={privacyLinkText}
                isFormEnabled={isFormEnabled}
                form={form}
                isCompleted={isCompleted}
                showPreferredContact={showPreferredContact}
                formErrors={formErrors}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitSuccess={submitSuccess}
                onSubmit={onSubmit}
                onFieldChange={onFieldChange}
              />
            </div>
          </section>

          <div className={styles.summaryWrapper}>
            <BookingSummary
              className={pulseSummary ? styles.summaryPulse : ""}
              copy={copy}
              currentLanguage={currentLanguage}
              selectedService={selectedSummaryService}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              confirmedBooking={confirmedBooking}
              clientPackage={clientPackage}
              timezone={bookingTimezone}
            />
          </div>
        </div>
      )}
    </Container>
  );
}
