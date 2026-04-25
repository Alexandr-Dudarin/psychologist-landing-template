import type { PublicBookingService, PublicBookingSlot } from "../../types/booking";
import { formatDateLabel } from "./bookingPage.helpers";
import type { BookingPageCopy, ConfirmedBooking } from "./bookingPage.types";
import styles from "./BookingPage.module.css";

type BookingSummaryProps = {
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  selectedService: PublicBookingService | null;
  selectedDate: string;
  selectedSlot: PublicBookingSlot | null;
  confirmedBooking: ConfirmedBooking | null;
};

export function BookingSummary({
  copy,
  currentLanguage,
  selectedService,
  selectedDate,
  selectedSlot,
  confirmedBooking,
}: BookingSummaryProps) {
  return (
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
  );
}
