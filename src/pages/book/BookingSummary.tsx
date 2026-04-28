import { useEffect, useState } from "react";
import type { PublicBookingService, PublicBookingSlot } from "../../types/booking";
import { formatDateLabel } from "./bookingPage.helpers";
import type { BookingPageCopy, ConfirmedBooking } from "./bookingPage.types";
import styles from "./BookingPage.module.css";

type BookingSummaryProps = {
  className?: string;
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  selectedService: PublicBookingService | null;
  selectedDate: string;
  selectedSlot: PublicBookingSlot | null;
  confirmedBooking: ConfirmedBooking | null;
};

export function BookingSummary({
  className,
  copy,
  currentLanguage,
  selectedService,
  selectedDate,
  selectedSlot,
  confirmedBooking,
}: BookingSummaryProps) {
  const [animateField, setAnimateField] = useState<
    "service" | "date" | "slot" | null
  >(null);

  // 👉 определяем, что именно изменилось
  useEffect(() => {
    if (selectedService) {
      setAnimateField("service");
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedDate) {
      setAnimateField("date");
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSlot) {
      setAnimateField("slot");
    }
  }, [selectedSlot]);

  // 👉 сбрасываем анимацию
  useEffect(() => {
    if (!animateField) return;

    const t = setTimeout(() => setAnimateField(null), 300);
    return () => clearTimeout(t);
  }, [animateField]);

  const selectedDateLabel = selectedDate
    ? formatDateLabel(selectedDate, currentLanguage)
    : copy.summaryWaiting;

  const selectedSlotLabel = selectedSlot
    ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
    : copy.summaryWaiting;

  const confirmedDateLabel = confirmedBooking
    ? formatDateLabel(confirmedBooking.startsAt.slice(0, 10), currentLanguage)
    : null;

  const confirmedTimeLabel = confirmedBooking
    ? `${confirmedBooking.startsAt.slice(11, 16)} - ${confirmedBooking.endsAt.slice(11, 16)}`
    : null;

  return (
    <aside className={`${styles.summary} ${className || ""}`}>
      <h2 className={styles.summaryTitle}>{copy.summaryTitle}</h2>

      <div className={styles.summaryList}>
        {/* УСЛУГА */}
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>{copy.summaryService}</span>
          <span
            className={`${styles.summaryValue} ${
              animateField === "service" ? styles.summaryValueAnimate : ""
            }`}
          >
            {selectedService?.title ?? copy.summaryWaiting}
          </span>
        </div>

        {/* ДАТА */}
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>{copy.summaryDate}</span>
          <span
            className={`${styles.summaryValue} ${
              animateField === "date" ? styles.summaryValueAnimate : ""
            }`}
          >
            {selectedDateLabel}
          </span>
        </div>

        {/* СЛОТ */}
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>{copy.summarySlot}</span>
          <span
            className={`${styles.summaryValue} ${
              animateField === "slot" ? styles.summaryValueAnimate : ""
            }`}
          >
            {selectedSlotLabel}
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
            {confirmedDateLabel ? <span>{confirmedDateLabel}</span> : null}
            {confirmedTimeLabel ? <span>{confirmedTimeLabel}</span> : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}