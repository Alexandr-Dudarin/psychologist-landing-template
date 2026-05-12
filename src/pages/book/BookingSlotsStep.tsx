import type { PublicBookingSlot } from "../../types/booking";
import type { BookingPageCopy } from "./bookingPage.types";
import pageStyles from "./BookingPage.module.css";
import styles from "./BookingSlotsStep.module.css";

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
    <div className={pageStyles.section}>
      <div className={pageStyles.sectionHeader}>
        <h2 className={pageStyles.sectionTitle}>{copy.slotsTitle}</h2>
        <p className={pageStyles.sectionHint}>{copy.slotsHint}</p>
      </div>

      {error ? (
        <div className={`${pageStyles.stateBox} ${pageStyles.errorBox}`}>{error}</div>
      ) : !selectedService || !selectedDate ? (
        <div className={pageStyles.stateBox}>{copy.slotsEmptySelection}</div>
      ) : isRefreshingSlots ? (
        <div className={pageStyles.stateBox}>{copy.loading}</div>
      ) : slots.length === 0 ? (
        <div className={pageStyles.stateBox}>{copy.slotsEmpty}</div>
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
                {slot.startTime}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
