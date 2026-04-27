import { useEffect, useRef, useState } from "react";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";

import { getPublicPricingServices } from "../../lib/services/getPublicPricingServices";
import { getBookingTarget } from "../../lib/booking/getBookingTarget";

import styles from "./Pricing.module.css";

type PricingCard = {
  id: string;
  title: string;
  price: string;
  description: string;
  durationMinutes?: number;
  featured?: boolean;
};

type PricingCopy = {
  loading: string;
  empty: string;
  errorFallback: string;
  durationLabel: string;
};

const pricingCopyByLanguage: Record<"ru" | "en", PricingCopy> = {
  ru: {
    loading: "Загружаем актуальные услуги...",
    empty: "Сейчас нет активных услуг для публичного прайса.",
    errorFallback: "Не удалось загрузить услуги для публичного прайса.",
    durationLabel: "мин",
  },
  en: {
    loading: "Loading current services...",
    empty: "There are no active services for public pricing right now.",
    errorFallback: "Failed to load services for public pricing.",
    durationLabel: "min",
  },
};

function formatServicePrice(value: number, language: "ru" | "en"): string {
  return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function Pricing() {
  const { language, t } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const copy = pricingCopyByLanguage[currentLanguage];

  const bookingTarget = getBookingTarget();

  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cardsRef = useRef<HTMLElement[]>([]);

  // загрузка данных
  useEffect(() => {
    let isActive = true;

    async function loadServices() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const items = await getPublicPricingServices();

        if (!isActive) return;

        setServices(items);
      } catch (error) {
        if (!isActive) return;

        setLoadError(
          error instanceof Error ? error.message : copy.errorFallback
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      isActive = false;
    };
  }, [copy.errorFallback]);

  // stagger-анимация
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;

            setTimeout(() => {
              el.classList.add(styles.cardVisible);
            }, index * 80);
          }
        });
      },
      { threshold: 0.2 }
    );

    cardsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [services]);

  const pricingCards: PricingCard[] = services.map((item, index) => {
    return {
      id: item.id,
      title: item.title,
      price: formatServicePrice(item.price, currentLanguage),
      description: item.description?.trim() || "",
      durationMinutes: item.durationMinutes,
      featured: index === 0,
    };
  });

  return (
    <section id="pricing" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={t.content.pricing.eyebrow}
          title={t.content.pricing.title}
          description={t.content.pricing.description}
        />

        {isLoading && (
          <div className={styles.stateBox}>{copy.loading}</div>
        )}

        {!isLoading && loadError && (
          <div className={`${styles.stateBox} ${styles.stateError}`}>
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && pricingCards.length === 0 && (
          <div className={styles.stateBox}>{copy.empty}</div>
        )}

        {!isLoading && !loadError && pricingCards.length > 0 && (
          <div className={styles.grid}>
            {pricingCards.map((item, index) => (
              <article
                key={item.id}
                ref={(el) => {
                  if (el) {
                    cardsRef.current[index] = el;
                  }
                }}
                className={`${styles.card} ${
                  item.featured ? styles.featured : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.price}>{item.price}</p>

                  {item.durationMinutes && (
                    <p className={styles.duration}>
                      {item.durationMinutes} {copy.durationLabel}
                    </p>
                  )}
                </div>

                <p className={styles.description}>{item.description}</p>

                <Button
                  href={bookingTarget}
                  variant={item.featured ? "primary" : "secondary"}
                  fullWidth
                >
                  {t.ui.buttons.book}
                </Button>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}