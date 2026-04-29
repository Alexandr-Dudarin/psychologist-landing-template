import type { PublicBookingSlot } from "../../types/booking";
import type { BookingPageCopy } from "./bookingPage.types";
import {
  formatBookingTime,
} from "../../lib/booking/formatBookingDateTime";
import { siteSettings } from "../../data/siteSettings";
import styles from "./BookingPage.module.css";

type BookingSlotsStepProps = {
  copy: BookingPageCopy;
  error: string | null;
  selectedService: boolean;
  selectedDate: string;
  isRefreshingSlots: boolean;
  slots: PublicBookingSlot[];
  selectedSlot: PublicBookingSlot | null;
  onSelect: (slot: PublicBookingSlot) => void;
};

export function BookingSlotsStep({
  copy,
  error,
  selectedService,
  selectedDate,
  isRefreshingSlots,
  slots,
  selectedSlot,
  onSelect,
}: BookingSlotsStepProps) {
  return (
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
                className={`${styles.slotButton} ${isActive ? styles.slotButtonActive : ""}`}
                onClick={() => onSelect(slot)}
              >
                {formatBookingTime(
                  slot.startsAt,
                  "ru-RU",
                  siteSettings.booking.timezone
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
