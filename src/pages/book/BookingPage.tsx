import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useLanguage } from "../../app/providers/LanguageProvider";
import {
  createPublicBooking,
  getPublicBookingAvailability,
  lookupPublicBookingPackage,
} from "../../lib/api/publicBooking";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingCreateSuccessResponse,
  PublicBookingPackageInfo,
  PublicBookingSlot,
} from "../../types/booking";
import { createPayment } from "../../lib/api/payment";
import { siteSettings } from "../../data/siteSettings";
import {
  buildCalendarDatesMeta,
  getPreferredContactFallback,
  getInitialVisibleMonth,
  getServiceFromPackage,
  getServiceFromPackagePlan,
  getSelectedService,
  splitClientName,
  validateForm,
} from "./bookingPage.helpers";
import { copyByLanguage } from "./bookingPage.copy";
import { getDefaultBookingTimezone } from "../../lib/booking/bookingTimezones";
import { getTimezoneLabel } from "../../lib/booking/getTimezoneLabel";
import { BookingPageContent } from "./BookingPageContent";
import { BookingRedirectOverlay } from "./BookingRedirectOverlay";
import {
  getPublicPricingPackagePlans,
  type PublicPricingPackagePlan,
} from "../../lib/services/getPublicPricingServices";
import {
  initialFormState,
  type BookingMode,
  type BookingFormErrors,
  type BookingFormState,
  type BookingPageCopy,
} from "./bookingPage.types";
import styles from "./BookingPage.module.css";

export function BookingPage() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasAppliedInitialSearchParams = useRef(false);

  const currentLanguage = language === "en" ? "en" : "ru";
  const locale = currentLanguage === "ru" ? "ru-RU" : "en-US";
  const weekStartsOn = currentLanguage === "ru" ? 1 : 0;
  const isPaymentEnabled = siteSettings.booking.paymentEnabled;
  const preferredContactSettings = siteSettings.preferredContactMethod;

  const bookingContent = t.content.booking;
  const privacyLinkText = t.ui.booking.privacyLinkText;

  const dateRef = useRef<HTMLDivElement | null>(null);
  const slotsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<PublicBookingAvailabilityResponse | null>(
    null
  );
  const [packagePlans, setPackagePlans] = useState<PublicPricingPackagePlan[]>(
    []
  );
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [selectedPackagePlanId, setSelectedPackagePlanId] = useState<
    number | null
  >(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicBookingSlot | null>(
    null
  );
  const [form, setForm] = useState<BookingFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [confirmedBooking, setConfirmedBooking] =
    useState<PublicBookingCreateSuccessResponse["booking"] | null>(null);
  const [bookingMode, setBookingMode] = useState<BookingMode>("regular");
  const [packageCode, setPackageCode] = useState("");
  const [packageContact, setPackageContact] = useState("");
  const [verifiedPackage, setVerifiedPackage] =
    useState<PublicBookingPackageInfo | null>(null);
  const [packageLookupError, setPackageLookupError] = useState<string | null>(
    null
  );
  const [isLookingUpPackage, setIsLookingUpPackage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingSlots, setIsRefreshingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [pulseSummary, setPulseSummary] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isCompleted = Boolean(confirmedBooking);
  const isPackagePurchaseMode = bookingMode === "buy-package";

  const isPackagePurchaseFeatureEnabled =
    siteSettings.servicePackages.enabled &&
    siteSettings.servicePackages.publicPricingEnabled;

  const isPackagePurchaseAvailable =
    isPackagePurchaseFeatureEnabled && packagePlans.length > 0;

  const isPackageBooking = bookingMode === "package" && Boolean(verifiedPackage);
  const shouldUsePayment =
    isPaymentEnabled && bookingMode === "regular" && !isPackageBooking;
  const shouldSubmitThroughPayment =
    isPaymentEnabled && (bookingMode === "regular" || isPackagePurchaseMode);

  const baseCopy = copyByLanguage[currentLanguage];
  const copy: BookingPageCopy = {
    ...baseCopy,
    serviceTitle: isPackagePurchaseMode
      ? baseCopy.packagePurchaseServiceTitle
      : baseCopy.serviceTitle,
    serviceHint: isPackagePurchaseMode
      ? baseCopy.packagePurchaseServiceHint
      : baseCopy.serviceHint,
    formTitle: isPackagePurchaseMode
      ? baseCopy.packagePurchaseFormTitle
      : baseCopy.formTitle,
    formHint: isPackagePurchaseMode
      ? baseCopy.packagePurchaseFormHint
      : baseCopy.formHint,
    formDisabled: isPackagePurchaseMode
      ? baseCopy.packagePurchaseFormDisabled
      : baseCopy.formDisabled,
    summaryFootnote: isPackagePurchaseMode
      ? baseCopy.packagePurchaseSummaryFootnote
      : baseCopy.summaryFootnote,
    submitIdle: shouldSubmitThroughPayment
      ? baseCopy.paymentSubmitIdle
      : baseCopy.submitIdle,
    submitLoading: shouldSubmitThroughPayment
      ? baseCopy.paymentSubmitLoading
      : baseCopy.submitLoading,
  };

  const resetPackageState = () => {
    setPackageCode("");
    setPackageContact("");
    setVerifiedPackage(null);
    setPackageLookupError(null);
  };

  const resetSelectionAfterServiceChange = () => {
    setSelectedDate("");
    setSelectedSlot(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  useEffect(() => {
    if (isRedirecting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isRedirecting]);

  useEffect(() => {
    if (hasAppliedInitialSearchParams.current) {
      return;
    }

    const modeParam = searchParams.get("mode");
    const rawPackagePlanId = Number(searchParams.get("packagePlanId"));
    const packageCodeFromUrl = searchParams.get("packageCode")?.trim() ?? "";
    const packageContactFromUrl =
      searchParams.get("packageContact")?.trim() ?? "";

    if (modeParam === "package") {
      hasAppliedInitialSearchParams.current = true;

      setBookingMode("package");
      setSelectedServiceId(null);
      setSelectedPackagePlanId(null);
      setSelectedDate("");
      setSelectedSlot(null);
      setSubmitError(null);
      setSubmitSuccess(null);
      setVerifiedPackage(null);
      setPackageLookupError(null);
      setPackageCode(packageCodeFromUrl);
      setPackageContact(packageContactFromUrl);

      return;
    }

    if (modeParam === "buy-package" && isPackagePurchaseFeatureEnabled) {
      hasAppliedInitialSearchParams.current = true;
      setBookingMode("buy-package");
      setSelectedServiceId(null);
      resetPackageState();
      resetSelectionAfterServiceChange();

      if (Number.isInteger(rawPackagePlanId) && rawPackagePlanId > 0) {
        setSelectedPackagePlanId(rawPackagePlanId);
      }
    }
  }, [isPackagePurchaseFeatureEnabled, searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [availabilityResponse, packagePlanItems] = await Promise.all([
          getPublicBookingAvailability(),
          getPublicPricingPackagePlans(),
        ]);

        if (!isActive) return;

        setData(availabilityResponse);
        setPackagePlans(packagePlanItems);
        setVisibleMonth(
          (current) => current || getInitialVisibleMonth(availabilityResponse, "")
        );
      } catch (loadError) {
        if (!isActive) return;

        setError(
          loadError instanceof Error ? loadError.message : copy.errorFallback
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadInitialData();

    return () => {
      isActive = false;
    };
  }, [copy.errorFallback]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (bookingMode !== "buy-package") {
      return;
    }

    if (isPackagePurchaseAvailable) {
      return;
    }

    setBookingMode("regular");
    setSelectedPackagePlanId(null);
    setSelectedServiceId(null);
    resetSelectionAfterServiceChange();
  }, [bookingMode, isLoading, isPackagePurchaseAvailable]);

  const resolvedVisibleMonth =
    visibleMonth || getInitialVisibleMonth(data, selectedDate);

  useEffect(() => {
    if (!selectedServiceId || !resolvedVisibleMonth) {
      setSelectedSlot(null);
      return;
    }

    let isActive = true;

    async function loadAvailability() {
      setIsRefreshingSlots(true);
      setError(null);

      try {
        const activeServiceId = selectedServiceId;
        if (activeServiceId === null) return;

        const response = await getPublicBookingAvailability({
          serviceId: activeServiceId,
          date: selectedDate || undefined,
          month: resolvedVisibleMonth,
        });

        if (!isActive) return;

        setData(response);
        setSelectedSlot((currentSlot) => {
          if (!currentSlot) return null;
          return (
            response.slots.find(
              (slot) => slot.startsAt === currentSlot.startsAt
            ) ?? currentSlot
          );
        });
      } catch (loadError) {
        if (!isActive) return;

        setError(
          loadError instanceof Error ? loadError.message : copy.errorFallback
        );
      } finally {
        if (isActive) setIsRefreshingSlots(false);
      }
    }

    void loadAvailability();

    return () => {
      isActive = false;
    };
  }, [copy.errorFallback, resolvedVisibleMonth, selectedDate, selectedServiceId]);

  const services = data?.services ?? [];
  const selectedPackagePlan =
    packagePlans.find((item) => item.packagePlanId === selectedPackagePlanId) ??
    null;
  const selectedServiceFromList = getSelectedService(services, selectedServiceId);
  const selectedService =
    selectedServiceFromList ??
    (verifiedPackage && selectedServiceId === verifiedPackage.serviceId
      ? getServiceFromPackage(verifiedPackage)
      : null);
  const selectedSummaryService =
    selectedService ??
    (isPackagePurchaseMode && selectedPackagePlan
      ? getServiceFromPackagePlan(selectedPackagePlan)
      : null);
  const slots = data?.slots ?? [];
  const monthAvailability = data?.monthAvailability ?? [];
  const isFormEnabled = isPackagePurchaseMode
    ? Boolean(selectedPackagePlan)
    : Boolean(selectedService && selectedDate && selectedSlot);
  const datesMeta = buildCalendarDatesMeta({ monthAvailability, copy });
  const bookingTimezone = data?.timezone ?? getDefaultBookingTimezone();
  const timezoneLabel = getTimezoneLabel(bookingTimezone, currentLanguage);

  const handleFormChange = <Field extends keyof BookingFormState>(
    field: Field,
    value: BookingFormState[Field]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (formErrors[field as keyof BookingFormErrors]) {
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    }

    if (submitError) setSubmitError(null);
  };

  const handleBookingModeChange = (mode: BookingMode) => {
    if (isCompleted) return;

    setBookingMode(mode);
    setSelectedServiceId(null);
    setSelectedPackagePlanId(null);
    resetSelectionAfterServiceChange();
    setError(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (mode !== "package") {
      resetPackageState();
    }
  };

  const handlePackagePlanSelect = (packagePlanId: number) => {
    if (isCompleted) return;

    setSelectedPackagePlanId(packagePlanId);
    setSelectedServiceId(null);
    resetSelectionAfterServiceChange();
    setSubmitError(null);
    setSubmitSuccess(null);

    setPulseSummary(true);
    window.setTimeout(() => setPulseSummary(false), 400);

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  };

  const handlePackageReset = () => {
    if (isCompleted) return;

    resetPackageState();
    setSelectedServiceId(null);
    resetSelectionAfterServiceChange();
  };

  const handlePackageCodeChange = (value: string) => {
    setPackageCode(value);
    setPackageLookupError(null);
  };

  const handlePackageContactChange = (value: string) => {
    setPackageContact(value);
    setPackageLookupError(null);
  };

  const handleServiceSelect = (serviceId: number) => {
    if (isCompleted) return;
    setSelectedServiceId(serviceId);
    setSelectedPackagePlanId(null);
    resetPackageState();
    resetSelectionAfterServiceChange();

    setPulseSummary(true);
    setTimeout(() => setPulseSummary(false), 300);

    setTimeout(() => {
      dateRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const handleDateChange = (date: string) => {
    if (isCompleted) return;
    setSelectedDate(date);
    setVisibleMonth(date.slice(0, 7));
    setSelectedSlot(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    setPulseSummary(true);
    setTimeout(() => setPulseSummary(false), 300);

    setTimeout(() => {
      slotsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  };

  const handleSlotSelect = (slot: PublicBookingSlot) => {
    if (isCompleted) return;
    setSelectedSlot(slot);
    setSubmitError(null);
    setSubmitSuccess(null);

    setPulseSummary(true);
    setTimeout(() => setPulseSummary(false), 400);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 120);
  };

  const handlePackageLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLookingUpPackage || isCompleted) return;

    const trimmedCode = packageCode.trim();
    const trimmedContact = packageContact.trim();

    setPackageLookupError(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!trimmedCode || !trimmedContact) {
      setPackageLookupError(copy.packageLookupRequiredError);
      return;
    }

    setIsLookingUpPackage(true);

    try {
      const response = await lookupPublicBookingPackage({
        code: trimmedCode,
        contact: trimmedContact,
      });

      const packageOwnerName = splitClientName(response.package.clientName);
      const preferredContact = getPreferredContactFallback(
        response.package,
        trimmedContact
      );

      setVerifiedPackage(response.package);
      setSelectedServiceId(response.package.serviceId);
      resetSelectionAfterServiceChange();

      setForm((current) => ({
        ...current,
        firstName: packageOwnerName.firstName || current.firstName,
        lastName: packageOwnerName.lastName || current.lastName,
        phone: response.package.clientPhone || current.phone || trimmedContact,
        email: response.package.clientEmail || current.email,
        preferredContactMethod: preferredContact.preferredContactMethod,
        preferredContactValue: preferredContact.preferredContactValue,
      }));

      setPulseSummary(true);
      window.setTimeout(() => setPulseSummary(false), 400);

      window.setTimeout(() => {
        dateRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 160);
    } catch (lookupError) {
      setVerifiedPackage(null);
      setSelectedServiceId(null);
      resetSelectionAfterServiceChange();

      setPackageLookupError(
        lookupError instanceof Error
          ? lookupError.message
          : copy.submitErrorFallback
      );
    } finally {
      setIsLookingUpPackage(false);
    }
  };

  const refreshSelectedDateAvailability = async () => {
    if (!selectedServiceId || !resolvedVisibleMonth) return;

    const activeServiceId = selectedServiceId;
    if (activeServiceId === null) return;

    const response = await getPublicBookingAvailability({
      serviceId: activeServiceId,
      date: selectedDate || undefined,
      month: resolvedVisibleMonth,
    });

    setData(response);

    setSelectedSlot((current) => {
      if (!current) return null;

      return (
        response.slots.find((slot) => slot.startsAt === current.startsAt) ??
        current
      );
    });
  };

  const redirectToPayment = (confirmationUrl: string) => {
    const target = new URL(confirmationUrl, window.location.origin);

    setIsRedirecting(true);

    if (target.origin === window.location.origin) {
      navigate(`${target.pathname}${target.search}${target.hash}`);
      return;
    }

    window.location.href = confirmationUrl;
  };

  const handleSubmitPackagePurchase = async () => {
    if (!selectedPackagePlan) {
      setSubmitError(copy.formDisabled);
      return;
    }

    if (!isPaymentEnabled) {
      setSubmitError(
        copy.packagePaymentUnavailableError
      );
      return;
    }

    const validationErrors = validateForm(
      form,
      bookingContent,
      preferredContactSettings
    );
    setFormErrors(validationErrors);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const currentRequestId = requestId ?? crypto.randomUUID();
      setRequestId(currentRequestId);

      const payment = await createPayment({
        requestId: currentRequestId,
        paymentKind: "service_package",
        packagePlanId: selectedPackagePlan.packagePlanId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        preferredContactMethod: preferredContactSettings.enabled
          ? form.preferredContactMethod
          : "",
        preferredContactValue: preferredContactSettings.enabled
          ? form.preferredContactValue.trim()
          : "",
        consent: form.consent,
      });

      redirectToPayment(payment.confirmationUrl);
    } catch (submitErrorValue) {
      setIsRedirecting(false);

      const publicError = submitErrorValue as Error & {
        code?: string;
        status?: number;
      };

      setSubmitError(publicError.message || copy.submitErrorFallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedSlot) {
      setSubmitError(copy.formDisabled);
      return;
    }

    const validationErrors = validateForm(
      form,
      bookingContent,
      preferredContactSettings
    );
    setFormErrors(validationErrors);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (Object.keys(validationErrors).length > 0) return;

    if (bookingMode === "package" && !verifiedPackage) {
      setSubmitError(copy.packageLookupRequiredError);
      return;
    }

    setIsSubmitting(true);

    try {
      const currentRequestId = requestId ?? crypto.randomUUID();
      setRequestId(currentRequestId);

      const payload = {
        requestId: currentRequestId,
        serviceId: selectedService.id,
        startsAt: selectedSlot.startsAt,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        preferredContactMethod: preferredContactSettings.enabled
          ? form.preferredContactMethod
          : "",
        preferredContactValue: preferredContactSettings.enabled
          ? form.preferredContactValue.trim()
          : "",
        clientPackageCode: verifiedPackage?.code ?? "",
        clientPackageContact: verifiedPackage
          ? packageContact.trim() ||
          verifiedPackage.clientEmail ||
          verifiedPackage.clientPhone
          : "",
        message: form.message.trim(),
        consent: form.consent,
      };

      if (shouldUsePayment) {
        const payment = await createPayment(payload);
        redirectToPayment(payment.confirmationUrl);
        return;
      }

      const response = await createPublicBooking(payload);

      setConfirmedBooking(response.booking);
      setSubmitSuccess(copy.submitSuccess);

      if (verifiedPackage && response.booking.clientPackage) {
        setVerifiedPackage({
          ...verifiedPackage,
          remainingSessions: response.booking.clientPackage.remainingSessions,
          usedSessions:
            verifiedPackage.totalSessions -
            response.booking.clientPackage.remainingSessions,
        });
      }

      setFormErrors({});
      setRequestId(null);

      await refreshSelectedDateAvailability();
    } catch (submitErrorValue) {
      setIsRedirecting(false);

      const publicError = submitErrorValue as Error & {
        code?: string;
        status?: number;
      };

      if (publicError.code === "slot_unavailable" || publicError.status === 409) {
        setSubmitError(copy.submitConflict);

        try {
          await refreshSelectedDateAvailability();
        } catch (refreshError) {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : copy.errorFallback
          );
        }
      } else {
        setSubmitError(publicError.message || copy.submitErrorFallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (isPackagePurchaseMode) {
      await handleSubmitPackagePurchase();
      return;
    }

    await handleSubmitBooking();
  };

  return (
    <main className={styles.page}>
      <BookingPageContent
        copy={copy}
        currentLanguage={currentLanguage}
        locale={locale}
        weekStartsOn={weekStartsOn}
        bookingContent={bookingContent}
        privacyLinkText={privacyLinkText}
        isLoading={isLoading}
        services={services}
        packagePlans={packagePlans}
        selectedServiceId={selectedServiceId}
        selectedPackagePlanId={selectedPackagePlanId}
        bookingMode={bookingMode}
        showPackagePurchaseMode={isPackagePurchaseAvailable}
        packageCode={packageCode}
        packageContact={packageContact}
        packageInfo={verifiedPackage}
        packageLookupError={packageLookupError}
        isLookingUpPackage={isLookingUpPackage}
        isPackagePurchaseMode={isPackagePurchaseMode}
        selectedService={selectedService}
        selectedDate={selectedDate}
        visibleMonth={resolvedVisibleMonth}
        minDate={data?.dateBounds.min}
        maxDate={data?.dateBounds.max}
        datesMeta={datesMeta}
        isRefreshingSlots={isRefreshingSlots}
        error={error}
        timezoneLabel={timezoneLabel}
        slots={slots}
        selectedSlot={selectedSlot}
        isFormEnabled={isFormEnabled}
        form={form}
        isCompleted={isCompleted}
        showPreferredContact={preferredContactSettings.enabled}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitSuccess={submitSuccess}
        pulseSummary={pulseSummary}
        selectedSummaryService={selectedSummaryService}
        confirmedBooking={confirmedBooking}
        clientPackage={verifiedPackage}
        bookingTimezone={bookingTimezone}
        dateRef={dateRef}
        slotsRef={slotsRef}
        formRef={formRef}
        onBookingModeChange={handleBookingModeChange}
        onPackagePlanSelect={handlePackagePlanSelect}
        onPackageCodeChange={handlePackageCodeChange}
        onPackageContactChange={handlePackageContactChange}
        onPackageLookup={handlePackageLookup}
        onPackageReset={handlePackageReset}
        onServiceSelect={handleServiceSelect}
        onDateChange={handleDateChange}
        onVisibleMonthChange={setVisibleMonth}
        onSlotSelect={handleSlotSelect}
        onSubmit={handleSubmit}
        onFieldChange={handleFormChange}
      />

      {isRedirecting ? (
        <BookingRedirectOverlay label={copy.submitLoading} />
      ) : null}
    </main>
  );
}