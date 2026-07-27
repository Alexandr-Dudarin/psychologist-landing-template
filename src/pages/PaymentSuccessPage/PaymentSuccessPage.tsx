import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import {
  formatBookingDate,
  formatBookingTime,
} from "../../lib/booking/formatBookingDateTime";
import { getDefaultBookingTimezone } from "../../lib/booking/bookingTimezones";
import { getTimezoneLabel } from "../../lib/booking/getTimezoneLabel";
import {
  getPaymentStatus,
  type PaymentStatusResponse,
} from "../../lib/api/payment";
import {
  trackFormSubmit,
  trackPackagePurchase,
} from "../../lib/analytics/trackers";
import { paymentSuccessPageCopy } from "./paymentSuccessPage.copy";
import styles from "./PaymentSuccessPage.module.css";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 7;

function getPackageBookingTarget(params: {
  code?: string;
  email?: string;
}): string {
  const searchParams = new URLSearchParams();

  searchParams.set("mode", "package");

  if (params.code?.trim()) {
    searchParams.set("packageCode", params.code.trim());
  }

  if (params.email?.trim()) {
    searchParams.set("packageContact", params.email.trim());
  }

  return `/book?${searchParams.toString()}`;
}

export function PaymentSuccessPage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [didReachPollLimit, setDidReachPollLimit] = useState(false);
  const trackedPaymentGoalRef = useRef<string | null>(null);

  const currentLanguage = language === "en" ? "en" : "ru";
  const locale = currentLanguage === "ru" ? "ru-RU" : "en-US";
  const copy = paymentSuccessPageCopy[currentLanguage];

  const bookingTimezone = payment?.timezone ?? getDefaultBookingTimezone();
  const timezoneLabel = getTimezoneLabel(bookingTimezone, currentLanguage);

  const requestId = useMemo(() => {
    const raw = searchParams.get("requestId");
    return raw?.trim() ?? "";
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    let pollAttempts = 0;
    let intervalId: number | null = null;

    async function loadStatus() {
      try {
        const status = await getPaymentStatus(requestId);

        if (!isMounted) {
          return;
        }

        setPayment(status);
        setErrorMessage(
          currentLanguage === "ru" ? status.errorMessage ?? null : null
        );

        if (status.status !== "pending") {
          setDidReachPollLimit(false);

          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          currentLanguage === "ru" && error instanceof Error
            ? error.message
            : copy.loadStatusError
        );

        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (!requestId) {
      setErrorMessage(copy.missingPaymentData);
      setIsLoading(false);

      return () => {
        isMounted = false;
      };
    }

    setDidReachPollLimit(false);
    void loadStatus();

    intervalId = window.setInterval(() => {
      pollAttempts += 1;

      if (pollAttempts >= MAX_POLL_ATTEMPTS) {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }

        if (isMounted) {
          setDidReachPollLimit(true);
        }

        return;
      }

      void loadStatus();
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    copy.loadStatusError,
    copy.missingPaymentData,
    currentLanguage,
    requestId,
  ]);

  useEffect(() => {
    if (payment?.status !== "paid") {
      setShowConfetti(false);
      return;
    }

    const timer = setTimeout(() => setShowConfetti(true), 200);
    return () => clearTimeout(timer);
  }, [payment?.status]);

  useEffect(() => {
    if (payment?.status !== "paid") {
      return;
    }

    const goalStorageKey = [
      "yandex-metrika-payment-goal",
      payment.paymentKind,
      payment.requestId,
    ].join(":");

    if (trackedPaymentGoalRef.current === goalStorageKey) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(goalStorageKey) === "sent") {
        trackedPaymentGoalRef.current = goalStorageKey;
        return;
      }
    } catch {
      // Аналитика не должна мешать странице оплаты,
      // если sessionStorage недоступен в текущем браузере.
    }

    const didTrack =
      payment.paymentKind === "service_package"
        ? trackPackagePurchase()
        : trackFormSubmit();

    if (!didTrack) {
      return;
    }

    trackedPaymentGoalRef.current = goalStorageKey;

    try {
      window.sessionStorage.setItem(goalStorageKey, "sent");
    } catch {
      // Цель уже отправлена. Ошибка сохранения маркера
      // не должна влиять на успешный сценарий оплаты.
    }
  }, [payment?.paymentKind, payment?.requestId, payment?.status]);

  const bookingStartsAt = payment?.booking.startsAt ?? "";
  const servicePackage = payment?.servicePackage ?? null;

  const packageBookingTarget = getPackageBookingTarget({
    code: servicePackage?.code,
    email: servicePackage?.email,
  });

  const isPending = payment?.status === "pending";
  const isCancelled = payment?.status === "cancelled";
  const isPaidBooking =
    payment?.status === "paid" &&
    payment.paymentKind === "booking" &&
    Boolean(bookingStartsAt);
  const isPaidPackage =
    payment?.status === "paid" &&
    payment.paymentKind === "service_package" &&
    Boolean(servicePackage);

  const isRetryAvailable =
    !isLoading &&
    payment !== null &&
    payment.status !== "paid" &&
    (payment.status !== "pending" || didReachPollLimit);

  const icon =
    isLoading || payment?.status === "paid" || isPending ? "🎉" : "⚠️";

  const title = isLoading
    ? copy.checkingTitle
    : isPaidPackage
      ? copy.packagePaidTitle
      : isPaidBooking
        ? copy.bookingConfirmedTitle
        : isCancelled
          ? copy.cancelledTitle
          : isPending
            ? copy.pendingTitle
            : copy.failedTitle;

  return (
    <section className={styles.section}>
      <Container>
        <div className={`${styles.card} ${styles.visible}`}>
          {showConfetti && <div className={styles.confetti} />}

          <div className={styles.icon} aria-hidden="true">
            {icon}
          </div>

          <h1 className={styles.title}>{title}</h1>

          <div className={styles.contentWrapper}>
            {isLoading ? (
              <p className={styles.fallback}>{copy.loadingText}</p>
            ) : isPaidPackage && servicePackage ? (
              <div className={`${styles.details} ${styles.packageDetails}`}>
                <p>
                  <strong>{copy.packageLabel}:</strong>{" "}
                  {servicePackage.packageTitle}
                </p>

                {servicePackage.serviceTitle ? (
                  <p>
                    <strong>{copy.serviceLabel}:</strong>{" "}
                    {servicePackage.serviceTitle}
                  </p>
                ) : null}

                {servicePackage.sessionsCount ? (
                  <p>
                    <strong>{copy.sessionsCountLabel}:</strong>{" "}
                    {servicePackage.sessionsCount}
                  </p>
                ) : null}

                <p>
                  <strong>{copy.nameLabel}:</strong>{" "}
                  {servicePackage.firstName} {servicePackage.lastName}
                </p>

                {servicePackage.email ? (
                  <p>
                    <strong>Email:</strong> {servicePackage.email}
                  </p>
                ) : null}

                {servicePackage.code ? (
                  <div className={styles.codeBox}>
                    <span className={styles.codeLabel}>
                      {copy.packageCodeLabel}
                    </span>
                    <strong className={styles.codeValue}>
                      {servicePackage.code}
                    </strong>
                  </div>
                ) : null}

                <p className={styles.packageHint}>{copy.packageHint}</p>
              </div>
            ) : isPaidBooking && bookingStartsAt ? (
              <div className={styles.details}>
                <p>
                  <strong>{copy.dateLabel}:</strong>{" "}
                  {formatBookingDate(bookingStartsAt, locale, bookingTimezone)}
                </p>

                <p>
                  <strong>{copy.timeLabel}:</strong>{" "}
                  {formatBookingTime(bookingStartsAt, locale, bookingTimezone)} (
                  {timezoneLabel})
                </p>

                <p>
                  <strong>{copy.nameLabel}:</strong>{" "}
                  {payment.booking.firstName} {payment.booking.lastName}
                </p>

                {payment.booking.email ? (
                  <p>
                    <strong>Email:</strong> {payment.booking.email}
                  </p>
                ) : null}
              </div>
            ) : isCancelled ? (
              <p className={styles.fallback}>
                {errorMessage || copy.cancelledText}
              </p>
            ) : isPending && didReachPollLimit ? (
              <p className={styles.fallback}>{copy.pendingLimitText}</p>
            ) : isPending ? (
              <p className={styles.fallback}>{copy.pendingText}</p>
            ) : (
              <p className={styles.fallback}>
                {errorMessage || copy.failedText}
              </p>
            )}
          </div>

          {isPaidBooking ? (
            <p className={styles.note}>{copy.paidBookingNote}</p>
          ) : null}

          {isPaidPackage ? (
            <p className={styles.note}>{copy.paidPackageNote}</p>
          ) : null}

          {!isLoading ? (
            <div className={styles.actions}>
              {isRetryAvailable ? (
                <div className={styles.actionLinks}>
                  <Link to="/book" className={styles.retryLink}>
                    {copy.retryButton}
                  </Link>

                  <Button href="/" variant="premium">
                    {copy.homeButton}
                  </Button>
                </div>
              ) : isPaidPackage ? (
                <div className={styles.actionLinks}>
                  <Button href={packageBookingTarget} variant="premium">
                    {copy.bookWithPackageButton}
                  </Button>

                  <Button href="/" variant="premium">
                    {copy.homeButton}
                  </Button>
                </div>
              ) : (
                <Button href="/" variant="premium">
                  {copy.homeButton}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}