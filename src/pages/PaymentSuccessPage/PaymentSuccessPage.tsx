import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container } from "../../components/Container/Container";
import { Button } from "../../components/Button/Button";
import styles from "./PaymentSuccessPage.module.css";

type BookingPayload = {
  serviceId: string;
  startsAt: string;
  firstName: string;
  lastName?: string;
  email?: string;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 600); // 🔥 задержка (ощущение обработки)

    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(() => {
    const encoded = searchParams.get("payload");

    if (!encoded) return null;

    try {
      return JSON.parse(decodeURIComponent(encoded)) as BookingPayload;
    } catch {
      return null;
    }
  }, [searchParams]);

  return (
    <section className={styles.section}>
      <Container>
        <div className={`${styles.card} ${isReady ? styles.visible : ""}`}>
          {/* 🎉 Конфетти */}
          {isReady && <div className={styles.confetti} />}

          <div className={styles.icon}>🎉</div>

          <h1 className={styles.title}>Запись подтверждена</h1>

          {data ? (
            <div className={styles.details}>
              <p>
                <strong>Дата:</strong> {formatDate(data.startsAt)}
              </p>

              <p>
                <strong>Время:</strong> {formatTime(data.startsAt)}
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

          <p className={styles.note}>
            Я свяжусь с вами в ближайшее время для подтверждения деталей.
          </p>

          <div className={styles.actions}>
            <Button href="/" variant="premium">
              На главную
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}