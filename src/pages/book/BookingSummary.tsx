import { useEffect, useState } from "react";
import type {
  PublicBookingPackageInfo,
  PublicBookingService,
  PublicBookingSlot,
} from "../../types/booking";
import { formatDateLabel } from "./bookingPage.helpers";
import type { BookingPageCopy, ConfirmedBooking } from "./bookingPage.types";
import styles from "./BookingSummary.module.css";

import { formatBookingTime } from "../../lib/booking/formatBookingDateTime";
import { getTimezoneLabel } from "../../lib/booking/getTimezoneLabel";

type BookingSummaryProps = {
  className?: string;
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  selectedService: PublicBookingService | null;
  selectedDate: string;
  selectedSlot: PublicBookingSlot | null;
  confirmedBooking: ConfirmedBooking | null;
  clientPackage: PublicBookingPackageInfo | null;
  timezone: string;
};

export function BookingSummary({
  className,
  copy,
  currentLanguage,
  selectedService,
  selectedDate,
  selectedSlot,
  confirmedBooking,
  clientPackage,
  timezone,
}: BookingSummaryProps) {
  const [animateField, setAnimateField] = useState<
    "service" | "package" | "date" | "slot" | null
  >(null);

  const locale = currentLanguage === "ru" ? "ru-RU" : "en-US";

  const timezoneLabel = getTimezoneLabel(timezone, currentLanguage);

  const packageTitle =
    confirmedBooking?.clientPackage?.packageTitle ??
    clientPackage?.packageTitle ??
    "";

  const packageCode =
    confirmedBooking?.clientPackage?.code ?? clientPackage?.code ?? "";

  const packageRemaining =
    confirmedBooking?.clientPackage?.remainingSessions ??
    clientPackage?.remainingSessions ??
    null;

  useEffect(() => {
    if (selectedService) setAnimateField("service");
  }, [selectedService]);

  useEffect(() => {
    if (packageTitle) setAnimateField("package");
  }, [packageTitle]);

  useEffect(() => {
    if (selectedDate) setAnimateField("date");
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSlot) setAnimateField("slot");
  }, [selectedSlot]);

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
    ? `${formatBookingTime(
        confirmedBooking.startsAt,
        locale,
        timezone
      )} - ${formatBookingTime(confirmedBooking.endsAt, locale, timezone)}`
    : null;

  return (
    <aside className={`${styles.summary} ${className || ""}`}>
      <h2 className={styles.summaryTitle}>{copy.summaryTitle}</h2>

      <div className={styles.summaryList}>
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

        {packageTitle ? (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{copy.summaryPackage}</span>
            <span
              className={`${styles.summaryValue} ${
                animateField === "package" ? styles.summaryValueAnimate : ""
              }`}
            >
              {packageTitle}
            </span>
            <span className={styles.packageMeta}>
              {packageCode}
              {packageRemaining !== null
                ? ` · ${copy.packageRemaining}: ${packageRemaining}`
                : ""}
            </span>
          </div>
        ) : null}

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

        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>{copy.summarySlot}</span>
          <span
            className={`${styles.summaryValue} ${
              animateField === "slot" ? styles.summaryValueAnimate : ""
            }`}
          >
            {selectedSlotLabel}
          </span>

          {selectedSlot ? (
            <div className={styles.timezoneLabel}>{timezoneLabel}</div>
          ) : null}
        </div>
      </div>

      <p className={styles.summaryFootnote}>{copy.summaryFootnote}</p>

      {confirmedBooking ? (
        <div className={styles.confirmationCard}>
          <h3 className={styles.confirmationTitle}>
            {copy.confirmationTitle}
          </h3>
          <p className={styles.confirmationText}>{copy.confirmationText}</p>

          <div className={styles.confirmationMeta}>
            <span>{confirmedBooking.serviceTitle}</span>
            {confirmedBooking.clientPackage ? (
              <span>
                {copy.summaryPackage}:{" "}
                {confirmedBooking.clientPackage.packageTitle}
              </span>
            ) : null}
            {confirmedDateLabel ? <span>{confirmedDateLabel}</span> : null}
            {confirmedTimeLabel ? <span>{confirmedTimeLabel}</span> : null}
          </div>

          <div className={styles.timezoneLabel}>{timezoneLabel}</div>
        </div>
      ) : null}
    </aside>
  );
}