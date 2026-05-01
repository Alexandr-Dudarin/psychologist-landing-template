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

type BookingPayload = {
  requestId: string;
  serviceId: string;
  startsAt: string;
  firstName: string;
  lastName?: string;
  email?: string;
};

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const locale = "ru-RU";

  const timezoneLabel = getTimezoneLabel(
    siteSettings.booking.timezone,
    locale.startsWith("ru") ? "ru" : "en"
  );

  const data = useMemo(() => {
    const encoded = searchParams.get("payload");

    if (!encoded) return null;

    try {
      return JSON.parse(decodeURIComponent(encoded)) as BookingPayload;
    } catch {
      return null;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!data) {
      setIsConfirming(false);
      return;
    }

    if (isConfirmed) return;

    async function confirm() {
      try {
        const res = await fetch("/api/public/booking/confirm-after-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error("Failed to confirm booking");
        }

        await res.json();
        setIsConfirmed(true);
      } catch (e) {
        console.error("Confirm booking failed", e);
      } finally {
        setIsConfirming(false);
      }
    }

    void confirm();
  }, [data, isConfirmed]);

  useEffect(() => {
    if (!isConfirmed) {
      setShowConfetti(false);
      return;
    }

    const timer = setTimeout(() => setShowConfetti(true), 200);
    return () => clearTimeout(timer);
  }, [isConfirmed]);

  return (
    <section className={styles.section}>
      <Container>
        <div className={`${styles.card} ${styles.visible}`}>
          {showConfetti && <div className={styles.confetti} />}

          <div className={styles.icon}>🎉</div>

          <h1 className={styles.title}>
            {isConfirming
              ? "Подтверждаем запись..."
              : isConfirmed
              ? "Запись подтверждена"
              : "Оплата получена"}
          </h1>

          <div className={styles.contentWrapper}>
            {isConfirming ? (
              <p className={styles.fallback}>
                Пожалуйста, подождите, мы подтверждаем вашу запись...
              </p>
            ) : isConfirmed && data ? (
              <div className={styles.details}>
                <p>
                  <strong>Дата:</strong>{" "}
                  {formatBookingDate(
                    data.startsAt,
                    "ru-RU",
                    siteSettings.booking.timezone
                  )}
                </p>

                <p>
                  <strong>Время:</strong>{" "}
                  {formatBookingTime(
                    data.startsAt,
                    "ru-RU",
                    siteSettings.booking.timezone
                  )}{" "}
                  ({timezoneLabel})
                </p>

                <p>
                  <strong>Имя:</strong> {data.firstName} {data.lastName ?? ""}
                </p>

                {data.email && (
                  <p>
                    <strong>Email:</strong> {data.email}
                  </p>
                )}
              </div>
            ) : (
              <p className={styles.fallback}>
                Мы получили вашу оплату и скоро свяжемся с вами 🤍
              </p>
            )}
          </div>

          {isConfirmed && (
            <p className={styles.note}>
              Я свяжусь с вами в ближайшее время для подтверждения деталей.
            </p>
          )}

          {!isConfirming && (
            <div className={styles.actions}>
              <Button href="/" variant="premium">
                На главную
              </Button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}