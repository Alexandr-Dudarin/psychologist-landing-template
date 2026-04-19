import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import {
  createPublicBooking,
  getPublicBookingAvailability,
} from "../../lib/api/publicBooking";
import type {
  PublicBookingAvailabilityResponse,
  PublicBookingCreateSuccessResponse,
  PublicBookingService,
  PublicBookingSlot,
} from "../../types/booking";
import styles from "./BookingPage.module.css";

type BookingPageCopy = {
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
};

type BookingFormState = {
  name: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

type BookingFormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  consent?: string;
};

const initialFormState: BookingFormState = {
  name: "",
  phone: "",
  email: "",
  message: "",
  consent: false,
};

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
      "Дата ограничена текущими настройками записи: окном бронирования, запретом на прошлое время и правилами расписания.",
    dateLabel: "Выберите дату",
    dateEmpty: "Сначала выберите услугу, затем дату.",
    slotsTitle: "3. Свободные слоты",
    slotsHint: "Слоты уже учитывают расписание, исключения, блокировки, buffer и занятые сессии.",
    slotsEmptySelection: "Выберите услугу и дату, чтобы увидеть свободные интервалы.",
    slotsEmpty: "На выбранную дату свободных слотов нет. Попробуйте другой день.",
    loading: "Загрузка доступности...",
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
      "Форма откроется после выбора слота. Запрос создаст клиента и сессию в CRM без повторного бронирования занятого времени.",
    formDisabled:
      "Выберите слот, чтобы заполнить форму и отправить запрос на бронирование.",
    submitIdle: "Подтвердить запись",
    submitLoading: "Отправляем запись...",
    submitSuccess: "Запись создана. Я свяжусь с вами, если понадобится дополнительное подтверждение.",
    submitConflict:
      "Этот слот уже заняли. Я обновил доступность на выбранную дату, пожалуйста, выберите другое время.",
    submitErrorFallback: "Не удалось создать запись. Попробуйте ещё раз позже.",
    confirmationTitle: "Запрос принят",
    confirmationText:
      "Сессия создана в CRM. Если слот был свободен в момент отправки, повторно бронировать его не нужно.",
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
      "The date field is limited by current booking settings, past-time protection, and the working schedule.",
    dateLabel: "Choose a date",
    dateEmpty: "Choose a service first, then pick a date.",
    slotsTitle: "3. Available slots",
    slotsHint: "Slots already account for schedule rules, overrides, blocked time, buffer, and occupied sessions.",
    slotsEmptySelection: "Choose a service and a date to see available slots.",
    slotsEmpty: "There are no open slots for this date. Please try another day.",
    loading: "Loading availability...",
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
    formDisabled: "Choose a slot to fill in your details and submit the booking request.",
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
  },
};

function formatDateLabel(value: string, language: "ru" | "en") {
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

function formatPrice(value: number, language: "ru" | "en") {
  return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSelectedService(
  services: PublicBookingService[],
  selectedServiceId: number | null
) {
  return services.find((service) => service.id === selectedServiceId) ?? null;
}

function validateForm(
  form: BookingFormState,
  bookingContent: ReturnType<typeof useLanguage>["t"]["content"]["booking"]
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!form.name.trim()) {
    errors.name = bookingContent.messages.nameError;
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

export function BookingPage() {
  const { language, t } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const copy = copyByLanguage[currentLanguage];
  const bookingContent = t.content.booking;
  const privacyLinkText = t.ui.booking.privacyLinkText;

  const [data, setData] = useState<PublicBookingAvailabilityResponse | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
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

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getPublicBookingAvailability();

        if (!isActive) {
          return;
        }

        setData(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : copy.errorFallback
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isActive = false;
    };
  }, [copy.errorFallback]);

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setSelectedSlot(null);
      return;
    }

    let isActive = true;

    async function loadSlots() {
      setIsRefreshingSlots(true);
      setError(null);

      try {
        const activeServiceId = selectedServiceId;

        if (activeServiceId === null) {
          return;
        }

        const response = await getPublicBookingAvailability({
          serviceId: activeServiceId,
          date: selectedDate,
        });

        if (!isActive) {
          return;
        }

        setData(response);
        setSelectedSlot((currentSlot) => {
          if (!currentSlot) {
            return null;
          }

          return (
            response.slots.find((slot) => slot.startsAt === currentSlot.startsAt) ?? null
          );
        });
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : copy.errorFallback
        );
      } finally {
        if (isActive) {
          setIsRefreshingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => {
      isActive = false;
    };
  }, [copy.errorFallback, selectedDate, selectedServiceId]);

  const services = data?.services ?? [];
  const selectedService = getSelectedService(services, selectedServiceId);
  const slots = data?.slots ?? [];
  const isFormEnabled = Boolean(selectedService && selectedDate && selectedSlot);

  const handleFormChange = (field: keyof BookingFormState, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (formErrors[field as keyof BookingFormErrors]) {
      setFormErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const refreshSelectedDateAvailability = async () => {
    if (!selectedServiceId || !selectedDate) {
      return;
    }

    const activeServiceId = selectedServiceId;

    if (activeServiceId === null) {
      return;
    }

    const response = await getPublicBookingAvailability({
      serviceId: activeServiceId,
      date: selectedDate,
    });

    setData(response);
    setSelectedSlot(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedService || !selectedSlot) {
      setSubmitError(copy.formDisabled);
      return;
    }

    const validationErrors = validateForm(form, bookingContent);
    setFormErrors(validationErrors);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createPublicBooking({
        serviceId: selectedService.id,
        startsAt: selectedSlot.startsAt,
        name: form.name.trim(),
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
        <div className={styles.hero}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.description}>{copy.description}</p>
        </div>

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{copy.serviceTitle}</h2>
                <p className={styles.sectionHint}>{copy.serviceHint}</p>
              </div>

              {isLoading ? (
                <div className={styles.stateBox}>{copy.loading}</div>
              ) : services.length === 0 ? (
                <div className={styles.stateBox}>{copy.serviceEmpty}</div>
              ) : (
                <div className={styles.servicesGrid}>
                  {services.map((service) => {
                    const isActive = service.id === selectedServiceId;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        className={`${styles.serviceCard} ${
                          isActive ? styles.serviceCardActive : ""
                        }`}
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setSelectedSlot(null);
                          setSubmitError(null);
                          setSubmitSuccess(null);
                        }}
                      >
                        <h3 className={styles.serviceCardTitle}>{service.title}</h3>
                        <div className={styles.serviceCardMeta}>
                          <span>
                            {copy.duration}: {service.durationMinutes} {copy.durationUnit}
                          </span>
                          <span>
                            {copy.price}: {formatPrice(service.price, currentLanguage)}
                          </span>
                        </div>
                        {service.description ? (
                          <p className={styles.serviceCardDescription}>
                            {service.description}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{copy.dateTitle}</h2>
                <p className={styles.sectionHint}>{copy.dateHint}</p>
              </div>

              {!selectedService ? (
                <div className={styles.stateBox}>{copy.dateEmpty}</div>
              ) : (
                <div className={styles.dateControl}>
                  <label className={styles.label} htmlFor="booking-date">
                    {copy.dateLabel}
                  </label>
                  <input
                    id="booking-date"
                    className={styles.dateInput}
                    type="date"
                    value={selectedDate}
                    min={data?.dateBounds.min}
                    max={data?.dateBounds.max}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedSlot(null);
                      setSubmitError(null);
                      setSubmitSuccess(null);
                    }}
                  />
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{copy.slotsTitle}</h2>
                <p className={styles.sectionHint}>{copy.slotsHint}</p>
              </div>

              {error ? (
                <div className={`${styles.stateBox} ${styles.errorBox}`}>{error}</div>
              ) : !selectedService || !selectedDate ? (
                <div className={styles.stateBox}>{copy.slotsEmptySelection}</div>
              ) : isRefreshingSlots ? (
                <div className={styles.stateBox}>{copy.loading}</div>
              ) : slots.length === 0 ? (
                <div className={styles.stateBox}>{copy.slotsEmpty}</div>
              ) : (
                <div className={styles.slotsGrid}>
                  {slots.map((slot) => {
                    const isActive = slot.startsAt === selectedSlot?.startsAt;

                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        className={`${styles.slotButton} ${
                          isActive ? styles.slotButtonActive : ""
                        }`}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSubmitError(null);
                          setSubmitSuccess(null);
                        }}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{copy.formTitle}</h2>
                <p className={styles.sectionHint}>{copy.formHint}</p>
              </div>

              {!isFormEnabled ? (
                <div className={styles.stateBox}>{copy.formDisabled}</div>
              ) : (
                <form className={styles.form} onSubmit={handleSubmit}>
                  <div className={styles.field}>
                    <label htmlFor="booking-name">{bookingContent.fields.name}</label>
                    <input
                      id="booking-name"
                      type="text"
                      value={form.name}
                      onChange={(event) => handleFormChange("name", event.target.value)}
                      placeholder={bookingContent.placeholders.name}
                    />
                    {formErrors.name ? (
                      <span className={styles.fieldError}>{formErrors.name}</span>
                    ) : null}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="booking-phone">{bookingContent.fields.phone}</label>
                    <input
                      id="booking-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => handleFormChange("phone", event.target.value)}
                      placeholder={bookingContent.placeholders.phone}
                    />
                    {formErrors.phone ? (
                      <span className={styles.fieldError}>{formErrors.phone}</span>
                    ) : null}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="booking-email">{bookingContent.fields.email}</label>
                    <input
                      id="booking-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => handleFormChange("email", event.target.value)}
                      placeholder={bookingContent.placeholders.email}
                    />
                    {formErrors.email ? (
                      <span className={styles.fieldError}>{formErrors.email}</span>
                    ) : null}
                  </div>

                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="booking-message">{bookingContent.fields.message}</label>
                    <textarea
                      id="booking-message"
                      value={form.message}
                      onChange={(event) => handleFormChange("message", event.target.value)}
                      placeholder={bookingContent.placeholders.message}
                    />
                  </div>

                  <div className={`${styles.checkboxField} ${styles.fullWidth}`}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(event) =>
                          handleFormChange("consent", event.target.checked)
                        }
                      />
                      <span>
                        {bookingContent.fields.consent}{" "}
                        <a href="#privacy" className={styles.policyLink}>
                          {privacyLinkText}
                        </a>
                      </span>
                    </label>
                    {formErrors.consent ? (
                      <span className={styles.fieldError}>{formErrors.consent}</span>
                    ) : null}
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? copy.submitLoading : copy.submitIdle}
                    </Button>
                  </div>

                  {submitError ? (
                    <div className={`${styles.stateBox} ${styles.errorBox}`}>
                      {submitError}
                    </div>
                  ) : null}

                  {submitSuccess ? (
                    <div className={`${styles.stateBox} ${styles.successBox}`}>
                      {submitSuccess}
                    </div>
                  ) : null}
                </form>
              )}
            </div>
          </section>

          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>{copy.summaryTitle}</h2>

            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{copy.summaryService}</span>
                <span className={styles.summaryValue}>
                  {selectedService?.title ?? copy.summaryWaiting}
                </span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{copy.summaryDate}</span>
                <span className={styles.summaryValue}>
                  {selectedDate
                    ? formatDateLabel(selectedDate, currentLanguage)
                    : copy.summaryWaiting}
                </span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{copy.summarySlot}</span>
                <span className={styles.summaryValue}>
                  {selectedSlot
                    ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                    : copy.summaryWaiting}
                </span>
              </div>
            </div>

            <p className={styles.summaryFootnote}>{copy.summaryFootnote}</p>

            {confirmedBooking ? (
              <div className={styles.confirmationCard}>
                <h3 className={styles.confirmationTitle}>{copy.confirmationTitle}</h3>
                <p className={styles.confirmationText}>{copy.confirmationText}</p>
                <div className={styles.confirmationMeta}>
                  <span>{confirmedBooking.serviceTitle}</span>
                  <span>
                    {formatDateLabel(
                      confirmedBooking.startsAt.slice(0, 10),
                      currentLanguage
                    )}
                  </span>
                  <span>
                    {confirmedBooking.startsAt.slice(11, 16)} -{" "}
                    {confirmedBooking.endsAt.slice(11, 16)}
                  </span>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </main>
  );
}
