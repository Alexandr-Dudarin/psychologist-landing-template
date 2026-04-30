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
    const [isReady, setIsReady] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isConfirming, setIsConfirming] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

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
        if (!data || isConfirmed) return;

        async function confirm() {
            try {
                const res = await fetch("/api/public/booking/confirm-after-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });

                const json = await res.json();

                console.log("CONFIRM RESPONSE:", json);

                setIsConfirmed(true);
            } catch (e) {
                console.error("Confirm booking failed", e);
            } finally {
                setIsConfirming(false);
            }
        }

        confirm();
    }, [data, isConfirmed]);

    return (
        <section className={styles.section}>
            <Container>
                <div className={`${styles.card} ${isReady ? styles.visible : ""}`}>
                    {/* 🎉 Конфетти */}
                    {isReady && <div className={styles.confetti} />}

                    <div className={styles.icon}>🎉</div>

                    <h1 className={styles.title}>
                        {isConfirming ? "Подтверждаем запись..." : "Запись подтверждена"}
                    </h1>

                    {isConfirming ? (
                        <p className={styles.fallback}>
                            Пожалуйста, подождите, мы подтверждаем вашу запись...
                        </p>
                    ) : data ? (
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