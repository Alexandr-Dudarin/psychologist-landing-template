import { useEffect, useState, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import {
  createPublicBooking,
  getPublicBookingAvailability,
} from "../../lib/api/publicBooking";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingCreateSuccessResponse,
  PublicBookingSlot,
} from "../../types/booking";
import { BookingDateStep } from "./BookingDateStep";
import { BookingFormStep } from "./BookingFormStep";
import {
  buildCalendarDatesMeta,
  getInitialVisibleMonth,
  getSelectedService,
  validateForm,
} from "./bookingPage.helpers";
import { BookingPageSkeleton } from "./BookingPageSkeleton";
import { BookingServiceStep } from "./BookingServiceStep";
import { BookingSlotsStep } from "./BookingSlotsStep";
import { BookingSummary } from "./BookingSummary";
import {
  initialFormState,
  type BookingFormErrors,
  type BookingFormState,
  type BookingPageCopy,
} from "./bookingPage.types";
import styles from "./BookingPage.module.css";

const copyByLanguage: Record<"ru" | "en", BookingPageCopy> = {
  ru: {
    eyebrow: "Онлайн-запись",
    title: "Выберите услугу, дату и удобный слот",
    description:
      "Выберите свободное время и сразу отправьте запрос на бронирование. Перед созданием записи сервер ещё раз проверит слот по актуальному расписанию.",
    serviceTitle: "1. Услуга",
    serviceHint: "Показываются только активные услуги из текущей CRM.",
    serviceEmpty: "Сейчас нет активных услуг для онлайн-записи.",
    dateTitle: "2. Дата",
    dateHint:
      "Календарь остаётся UI-слоем выбора даты. Доступный диапазон ограничен текущими настройками записи и защитой от прошлых дат.",
    dateLabel: "Выберите дату",
    dateEmpty: "Сначала выберите услугу, затем дату.",
    slotsTitle: "3. Свободные слоты",
    slotsHint:
      "Слоты уже учитывают расписание, исключения, блокировки, buffer и занятые сессии.",
    slotsEmptySelection:
      "Выберите услугу и дату, чтобы увидеть свободные интервалы.",
    slotsEmpty: "На выбранную дату свободных слотов нет. Попробуйте другой день.",
    loading: "Загрузка доступности...",
    loadingCalendar: "Календарь обновляется...",
    errorFallback: "Не удалось загрузить доступность",
    summaryTitle: "Ваш выбор",
    summaryService: "Услуга",
    summaryDate: "Дата",
    summarySlot: "Слот",
    summaryWaiting: "Пока ничего не выбрано",
    summaryFootnote:
      "После отправки сервер повторно проверяет слот и создаёт запись только если время всё ещё свободно.",
    duration: "Длительность",
    durationUnit: "мин",
    price: "Стоимость",
    formTitle: "4. Данные для записи",
    formHint:
      "Форма откроется после выбора слота. Запрос создаст или переиспользует клиента и создаст сессию в CRM без двойного бронирования.",
    formDisabled:
      "Выберите слот, чтобы заполнить форму и отправить запрос на бронирование.",
    submitIdle: "Подтвердить запись",
    submitLoading: "Отправляем запись...",
    submitSuccess:
      "Запись создана. Я свяжусь с вами, если понадобится дополнительное подтверждение.",
    submitConflict:
      "Этот слот уже заняли. Я обновил доступность на выбранную дату, пожалуйста, выберите другое время.",
    submitErrorFallback:
      "Не удалось создать запись. Попробуйте ещё раз позже.",
    confirmationTitle: "Запрос принят",
    confirmationText:
      "Сессия создана в CRM. Если слот был свободен в момент отправки, повторно бронировать его не нужно.",
    calendarAvailableLabel: "Свободно",
    calendarAvailableHint: "На выбранную дату есть доступные слоты.",
    calendarUnavailableLabel: "Нет мест",
    calendarUnavailableHint: "На выбранную дату сейчас нет свободных слотов.",
    calendarDisabledLabel: "Недоступно",
    calendarDisabledHint: "Этот день недоступен для онлайн-записи.",
  },
  en: {
    eyebrow: "Booking",
    title: "Choose a service, date, and available slot",
    description:
      "Pick an open time and submit your booking request right away. The server will re-check the slot against the latest schedule before creating anything.",
    serviceTitle: "1. Service",
    serviceHint: "Only active services from the current CRM are shown here.",
    serviceEmpty: "There are no active services available right now.",
    dateTitle: "2. Date",
    dateHint:
      "The calendar stays a UI-only date picker. The selectable range is limited by current booking settings and past-date protection.",
    dateLabel: "Choose a date",
    dateEmpty: "Choose a service first, then pick a date.",
    slotsTitle: "3. Available slots",
    slotsHint:
      "Slots already account for schedule rules, overrides, blocked time, buffer, and occupied sessions.",
    slotsEmptySelection: "Choose a service and a date to see available slots.",
    slotsEmpty: "There are no open slots for this date. Please try another day.",
    loading: "Loading availability...",
    loadingCalendar: "Refreshing calendar...",
    errorFallback: "Failed to load availability",
    summaryTitle: "Your selection",
    summaryService: "Service",
    summaryDate: "Date",
    summarySlot: "Slot",
    summaryWaiting: "Nothing selected yet",
    summaryFootnote:
      "After submit, the server checks the slot again and only creates a booking if the time is still free.",
    duration: "Duration",
    durationUnit: "min",
    price: "Price",
    formTitle: "4. Booking details",
    formHint:
      "The form opens after you choose a slot. The request will create or reuse a client and create a session in CRM without double-booking an occupied time.",
    formDisabled:
      "Choose a slot to fill in your details and submit the booking request.",
    submitIdle: "Confirm booking",
    submitLoading: "Creating booking...",
    submitSuccess:
      "Your booking has been created. I will reach out if any extra confirmation is needed.",
    submitConflict:
      "This slot has just been taken. Availability has been refreshed for the selected date, please choose another time.",
    submitErrorFallback: "Failed to create the booking. Please try again later.",
    confirmationTitle: "Request accepted",
    confirmationText:
      "The session has been created in CRM. If the slot was free at submit time, it does not need to be booked again.",
    calendarAvailableLabel: "Open",
    calendarAvailableHint: "This selected date currently has open slots.",
    calendarUnavailableLabel: "Busy",
    calendarUnavailableHint: "This selected date currently has no open slots.",
    calendarDisabledLabel: "Closed",
    calendarDisabledHint: "This day is not bookable online.",
  },
};

export function BookingPage() {
  const { language, t } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const locale = currentLanguage === "ru" ? "ru-RU" : "en-US";
  const weekStartsOn = currentLanguage === "ru" ? 1 : 0;
  const copy = copyByLanguage[currentLanguage];
  const bookingContent = t.content.booking;
  const privacyLinkText = t.ui.booking.privacyLinkText;

  const dateRef = useRef<HTMLDivElement | null>(null);
  const slotsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<PublicBookingAvailabilityResponse | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicBookingSlot | null>(null);
  const [form, setForm] = useState<BookingFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [confirmedBooking, setConfirmedBooking] =
    useState<PublicBookingCreateSuccessResponse["booking"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingSlots, setIsRefreshingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [pulseSummary, setPulseSummary] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getPublicBookingAvailability();

        if (!isActive) return;

        setData(response);
        setVisibleMonth((current) => current || getInitialVisibleMonth(response, ""));
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

  const resolvedVisibleMonth = visibleMonth || getInitialVisibleMonth(data, selectedDate);

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
            response.slots.find((slot) => slot.startsAt === currentSlot.startsAt) ?? null
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
  const selectedService = getSelectedService(services, selectedServiceId);
  const slots = data?.slots ?? [];
  const monthAvailability = data?.monthAvailability ?? [];
  const isFormEnabled = Boolean(selectedService && selectedDate && selectedSlot);
  const datesMeta = buildCalendarDatesMeta({ monthAvailability, copy });

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
    setSelectedSlot(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedService || !selectedSlot) {
      setSubmitError(copy.formDisabled);
      return;
    }

    const validationErrors = validateForm(form, bookingContent);
    setFormErrors(validationErrors);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const response = await createPublicBooking({
        serviceId: selectedService.id,
        startsAt: selectedSlot.startsAt,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        consent: form.consent,
      });

      setConfirmedBooking(response.booking);
      setSubmitSuccess(copy.submitSuccess);
      setForm(initialFormState);
      setFormErrors({});
      await refreshSelectedDateAvailability();
    } catch (submitErrorValue) {
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

  return (
    <main className={styles.page}>
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
                  selectedServiceId={selectedServiceId}
                  onSelect={(serviceId) => {
                    setSelectedServiceId(serviceId);
                    setSelectedSlot(null);
                    setSubmitError(null);
                    setSubmitSuccess(null);

                    setTimeout(() => {
                      dateRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 120);
                  }}
                />
              </div>

              <div
                ref={dateRef}
                className={!selectedService ? styles.stepDisabled : styles.stepActive}
              >
                <BookingDateStep
                  copy={copy}
                  selectedService={Boolean(selectedService)}
                  selectedDate={selectedDate}
                  visibleMonth={resolvedVisibleMonth}
                  minDate={data?.dateBounds.min}
                  maxDate={data?.dateBounds.max}
                  datesMeta={datesMeta}
                  isRefreshingSlots={isRefreshingSlots}
                  error={error}
                  locale={locale}
                  weekStartsOn={weekStartsOn}
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    setVisibleMonth(date.slice(0, 7));
                    setSelectedSlot(null);
                    setSubmitError(null);
                    setSubmitSuccess(null);

                    setTimeout(() => {
                      slotsRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 120);
                  }}
                  onVisibleMonthChange={setVisibleMonth}
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
                <BookingSlotsStep
                  copy={copy}
                  error={error}
                  selectedService={Boolean(selectedService)}
                  selectedDate={selectedDate}
                  isRefreshingSlots={isRefreshingSlots}
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={(slot) => {
                    setSelectedSlot(slot);
                    setSubmitError(null);
                    setSubmitSuccess(null);

                    setPulseSummary(true);
                    setTimeout(() => setPulseSummary(false), 400);

                    setTimeout(() => {
                      formRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 120);
                  }}
                />
              </div>

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
                  formErrors={formErrors}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  submitSuccess={submitSuccess}
                  onSubmit={handleSubmit}
                  onFieldChange={handleFormChange}
                />
              </div>
            </section>
            <div className={styles.summaryWrapper}>
            <BookingSummary
              className={pulseSummary ? styles.summaryPulse : ""}
              copy={copy}
              currentLanguage={currentLanguage}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              confirmedBooking={confirmedBooking}
            />
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}