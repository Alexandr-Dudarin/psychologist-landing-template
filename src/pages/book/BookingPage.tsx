import { useEffect, useState } from "react";
import { Container } from "../../components/Container/Container";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getPublicBookingAvailability } from "../../lib/api/publicBooking";
import type {
  PublicBookingAvailabilityResponse,
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
};

const copyByLanguage: Record<"ru" | "en", BookingPageCopy> = {
  ru: {
    eyebrow: "Онлайн-запись",
    title: "Выберите услугу, дату и удобный слот",
    description:
      "Это первый этап публичной записи: здесь можно посмотреть доступные услуги и свободное время. Подтверждение записи и оплата появятся позже.",
    serviceTitle: "1. Услуга",
    serviceHint: "Показываются только активные услуги из текущей CRM.",
    serviceEmpty: "Сейчас нет активных услуг для онлайн-записи.",
    dateTitle: "2. Дата",
    dateHint:
      "Дата ограничена текущими настройками записи: окном бронирования, запретом на прошлое время и правилами расписания.",
    dateLabel: "Выберите дату",
    dateEmpty: "Сначала выберите услугу, затем дату.",
    slotsTitle: "3. Свободные слоты",
    slotsHint: "Слоты уже учитывают расписание, исключения, блокировки и занятые сессии.",
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
      "Эта страница пока не создаёт запись в базе и не отправляет оплату: она показывает только доступность для первого этапа booking flow.",
    duration: "Длительность",
    durationUnit: "мин",
    price: "Стоимость",
  },
  en: {
    eyebrow: "Booking",
    title: "Choose a service, date, and available time",
    description:
      "This is phase 1 of public booking: you can review active services and open time slots. Final confirmation and payment will be added later.",
    serviceTitle: "1. Service",
    serviceHint: "Only active services from the current CRM are shown here.",
    serviceEmpty: "There are no active services available right now.",
    dateTitle: "2. Date",
    dateHint:
      "The date field is limited by current booking settings, past-time protection, and the working schedule.",
    dateLabel: "Choose a date",
    dateEmpty: "Choose a service first, then pick a date.",
    slotsTitle: "3. Available slots",
    slotsHint: "Slots already account for schedule rules, overrides, blocked time, and occupied sessions.",
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
      "This page does not create a booking yet and does not process payment. It only exposes availability for the first public booking pass.",
    duration: "Duration",
    durationUnit: "min",
    price: "Price",
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

export function BookingPage() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const copy = copyByLanguage[currentLanguage];

  const [data, setData] = useState<PublicBookingAvailabilityResponse | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicBookingSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingSlots, setIsRefreshingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const response = await getPublicBookingAvailability({
          serviceId: selectedServiceId,
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
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
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
          </aside>
        </div>
      </Container>
    </main>
  );
}
