import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { siteSettings } from "../../data/siteSettings";
import { Container } from "../../components/Container/Container";
import { Button } from "../../components/Button/Button";
import styles from "./PaymentSuccessPage.module.css";
import { getTimezoneLabel } from "../../lib/booking/getTimezoneLabel";
import {
  formatBookingDate,
  formatBookingTime,
} from "../../lib/booking/formatBookingDateTime";
import {
  getPaymentStatus,
  type PaymentStatusResponse,
} from "../../lib/api/payment";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 10;

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [didReachPollLimit, setDidReachPollLimit] = useState(false);

  const locale = "ru-RU";

  const timezoneLabel = getTimezoneLabel(
    siteSettings.booking.timezone,
    locale.startsWith("ru") ? "ru" : "en"
  );

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
  const isPending = payment?.status === "pending";
  const isCancelled = payment?.status === "cancelled";
  const isRetryAvailable =
    !isLoading && payment !== null && payment.status !== "paid" && payment.status !== "pending";

  return (
    <section className={styles.section}>
      <Container>
        <div className={`${styles.card} ${styles.visible}`}>
          {showConfetti && <div className={styles.confetti} />}

          <div className={styles.icon}>🎉</div>

          <h1 className={styles.title}>
            {isLoading
              ? "Проверяем статус оплаты..."
              : payment?.status === "paid"
              ? "Запись подтверждена"
              : isCancelled
              ? "Оплата не завершена"
              : isPending
              ? "Проверяем статус оплаты"
              : "Не удалось подтвердить оплату"}
          </h1>

          <div className={styles.contentWrapper}>
            {isLoading ? (
              <p className={styles.fallback}>
                Пожалуйста, подождите, мы проверяем статус оплаты и записи...
              </p>
            ) : payment?.status === "paid" && bookingStartsAt ? (
              <div className={styles.details}>
                <p>
                  <strong>Дата:</strong>{" "}
                  {formatBookingDate(
                    bookingStartsAt,
                    "ru-RU",
                    siteSettings.booking.timezone
                  )}
                </p>

                <p>
                  <strong>Время:</strong>{" "}
                  {formatBookingTime(
                    bookingStartsAt,
                    "ru-RU",
                    siteSettings.booking.timezone
                  )}{" "}
                  ({timezoneLabel})
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
                  "Оплата была отменена или не завершилась. Запись не создана. Вы можете вернуться на сайт и попробовать снова."}
              </p>
            ) : isPending && didReachPollLimit ? (
              <p className={styles.fallback}>
                Мы пока не получили финальный статус оплаты. Если вы отменили
                оплату или закрыли окно оплаты, запись не будет создана. Если
                платёж был успешно завершён, обновите страницу через несколько
                секунд.
              </p>
            ) : isPending ? (
              <p className={styles.fallback}>
                Мы проверяем статус оплаты. Если вы отменили оплату или закрыли
                окно оплаты, запись создана не будет. Обычно статус обновляется
                автоматически меньше чем за минуту.
              </p>
            ) : (
              <p className={styles.fallback}>
                {errorMessage || "Не удалось подтвердить оплату или создать запись."}
              </p>
            )}
          </div>

          {payment?.status === "paid" ? (
            <p className={styles.note}>
              Я свяжусь с вами в ближайшее время для подтверждения деталей.
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