import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [didReachPollLimit, setDidReachPollLimit] = useState(false);

  const locale = "ru-RU";
  const bookingTimezone = payment?.timezone ?? getDefaultBookingTimezone();
  const timezoneLabel = getTimezoneLabel(bookingTimezone, "ru");

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
        setErrorMessage(status.errorMessage ?? null);

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
          error instanceof Error
            ? error.message
            : "Не удалось загрузить статус оплаты."
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
      setErrorMessage("Не удалось найти данные оплаты.");
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
  }, [requestId]);

  useEffect(() => {
    if (payment?.status !== "paid") {
      setShowConfetti(false);
      return;
    }

    const timer = setTimeout(() => setShowConfetti(true), 200);
    return () => clearTimeout(timer);
  }, [payment?.status]);

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
    ? "Проверяем статус оплаты..."
    : isPaidPackage
      ? "Пакет оплачен"
      : isPaidBooking
        ? "Запись подтверждена"
        : isCancelled
          ? "Оплата не завершена"
          : isPending
            ? "Проверяем статус оплаты"
            : "Не удалось подтвердить оплату";

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
              <p className={styles.fallback}>
                Пожалуйста, подождите: мы проверяем статус оплаты.
              </p>
            ) : isPaidPackage && servicePackage ? (
              <div className={`${styles.details} ${styles.packageDetails}`}>
                <p>
                  <strong>Пакет:</strong> {servicePackage.packageTitle}
                </p>

                {servicePackage.serviceTitle ? (
                  <p>
                    <strong>Услуга:</strong> {servicePackage.serviceTitle}
                  </p>
                ) : null}

                {servicePackage.sessionsCount ? (
                  <p>
                    <strong>Количество сессий:</strong>{" "}
                    {servicePackage.sessionsCount}
                  </p>
                ) : null}

                <p>
                  <strong>Имя:</strong> {servicePackage.firstName}{" "}
                  {servicePackage.lastName}
                </p>

                {servicePackage.email ? (
                  <p>
                    <strong>Email:</strong> {servicePackage.email}
                  </p>
                ) : null}

                {servicePackage.code ? (
                  <div className={styles.codeBox}>
                    <span className={styles.codeLabel}>Код пакета</span>
                    <strong className={styles.codeValue}>
                      {servicePackage.code}
                    </strong>
                  </div>
                ) : null}

                <p className={styles.packageHint}>
                  Код также будет отправлен на email. Используйте его на
                  странице онлайн-записи, чтобы записываться по пакету.
                </p>
              </div>
            ) : isPaidBooking && bookingStartsAt ? (
              <div className={styles.details}>
                <p>
                  <strong>Дата:</strong>{" "}
                  {formatBookingDate(bookingStartsAt, locale, bookingTimezone)}
                </p>

                <p>
                  <strong>Время:</strong>{" "}
                  {formatBookingTime(bookingStartsAt, locale, bookingTimezone)} (
                  {timezoneLabel})
                </p>

                <p>
                  <strong>Имя:</strong> {payment.booking.firstName}{" "}
                  {payment.booking.lastName}
                </p>

                {payment.booking.email ? (
                  <p>
                    <strong>Email:</strong> {payment.booking.email}
                  </p>
                ) : null}
              </div>
            ) : isCancelled ? (
              <p className={styles.fallback}>
                {errorMessage ||
                  "Оплата была отменена или не завершилась. Вы можете вернуться на сайт и попробовать снова."}
              </p>
            ) : isPending && didReachPollLimit ? (
              <p className={styles.fallback}>
                Мы пока не получили финальный статус оплаты. Если вы отменили
                оплату или закрыли окно оплаты, действие не будет завершено. Если
                платёж был успешно завершён, обновите страницу через несколько
                секунд.
              </p>
            ) : isPending ? (
              <p className={styles.fallback}>
                Мы проверяем статус оплаты. Если вы отменили оплату или закрыли
                окно оплаты, действие не будет завершено. Обычно статус
                обновляется автоматически меньше чем за минуту.
              </p>
            ) : (
              <p className={styles.fallback}>
                {errorMessage ||
                  "Не удалось подтвердить оплату или завершить действие."}
              </p>
            )}
          </div>

          {isPaidBooking ? (
            <p className={styles.note}>
              Я свяжусь с вами в ближайшее время для подтверждения деталей.
            </p>
          ) : null}

          {isPaidPackage ? (
            <p className={styles.note}>
              Сохраните код пакета: он понадобится для записи на консультации.
            </p>
          ) : null}

          {!isLoading ? (
            <div className={styles.actions}>
              {isRetryAvailable ? (
                <div className={styles.actionLinks}>
                  <Link to="/book" className={styles.retryLink}>
                    Попробовать снова
                  </Link>

                  <Button href="/" variant="premium">
                    На главную
                  </Button>
                </div>
              ) : isPaidPackage ? (
                <div className={styles.actionLinks}>
                  <Button href={packageBookingTarget} variant="premium">
                    Записаться по пакету
                  </Button>

                  <Button href="/" variant="premium">
                    На главную
                  </Button>
                </div>
              ) : (
                <Button href="/" variant="premium">
                  На главную
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}