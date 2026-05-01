import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  completeMockPayment,
  getPaymentStatus,
  type PaymentStatusResponse,
} from "../../lib/api/payment";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    async function syncPaymentState() {
      if (!requestId) {
        if (isMounted) {
          setErrorMessage("Не удалось найти данные оплаты.");
          setIsLoading(false);
        }
        return;
      }

      try {
        // ВРЕМЕННЫЙ MOCK-ПРОВАЙДЕР:
        // позже это место заменится реальным webhook от платёжного сервиса.
        await completeMockPayment(requestId).catch(() => undefined);

        const status = await getPaymentStatus(requestId);

        if (!isMounted) return;

        setPayment(status);
        setErrorMessage(status.errorMessage ?? null);
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить статус оплаты."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void syncPaymentState();

    return () => {
      isMounted = false;
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

  return (
    <section className={styles.section}>
      <Container>
        <div className={`${styles.card} ${styles.visible}`}>
          {showConfetti && <div className={styles.confetti} />}

          <div className={styles.icon}>🎉</div>

          <h1 className={styles.title}>
            {isLoading
              ? "Подтверждаем оплату..."
              : payment?.status === "paid"
              ? "Запись подтверждена"
              : payment?.status === "pending"
              ? "Оплата получена"
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
            ) : payment?.status === "pending" ? (
              <p className={styles.fallback}>
                Мы получили информацию об оплате. Пожалуйста, подождите ещё немного.
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
              <Button href="/" variant="premium">
                На главную
              </Button>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}