import { useEffect, useState } from "react";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import { getPublicServices } from "../../lib/api/publicServices";
import { getBookingTarget } from "../../lib/booking/getBookingTarget";
import type { CrmServiceRecord } from "../../types/service";
import styles from "./Pricing.module.css";

type PricingCard = {
  title: string;
  price: string;
  description: string;
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

function mapDatabaseServicesToPricingCards(
  items: CrmServiceRecord[],
  language: "ru" | "en",
  durationLabel: string
): PricingCard[] {
  return items.map((item, index) => {
    const descriptionParts = [item.description?.trim() || ""];
    descriptionParts.push(`${item.durationMinutes} ${durationLabel}`);

    return {
      title: item.title,
      price: formatServicePrice(item.price, language),
      description: descriptionParts.filter(Boolean).join(" • "),
      featured: index === 0,
    };
  });
}

export function Pricing() {
  const { language, t } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const copy = pricingCopyByLanguage[currentLanguage];
  const { config, content, ui } = t;
  const bookingTarget = getBookingTarget();
  const pricingSource = siteSettings.pricing.source;
  const [databaseItems, setDatabaseItems] = useState<CrmServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(pricingSource === "database");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (pricingSource !== "database") {
      setDatabaseItems([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let isActive = true;

    async function loadServices() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const items = await getPublicServices();

        if (!isActive) {
          return;
        }

        setDatabaseItems(items);
      } catch (error) {
        if (!isActive) {
          return;
        }

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
  }, [copy.errorFallback, pricingSource]);

  const pricingCards =
    pricingSource === "database"
      ? mapDatabaseServicesToPricingCards(
          databaseItems,
          currentLanguage,
          copy.durationLabel
        )
      : config.pricing;

  return (
    <section id="pricing" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.pricing.eyebrow}
          title={content.pricing.title}
          description={content.pricing.description}
        />

        {pricingSource === "database" && isLoading ? (
          <div className={styles.stateBox}>{copy.loading}</div>
        ) : null}

        {pricingSource === "database" && !isLoading && loadError ? (
          <div className={`${styles.stateBox} ${styles.stateError}`}>{loadError}</div>
        ) : null}

        {pricingSource === "database" &&
        !isLoading &&
        !loadError &&
        pricingCards.length === 0 ? (
          <div className={styles.stateBox}>{copy.empty}</div>
        ) : null}

        {(pricingSource === "config" ||
          (!isLoading && !loadError && pricingCards.length > 0)) && (
          <div className={styles.grid}>
            {pricingCards.map((item) => (
              <article
                key={item.title}
                className={`${styles.card} ${item.featured ? styles.featured : ""}`}
              >
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.price}>{item.price}</p>
                </div>

                <p className={styles.description}>{item.description}</p>

                <Button
                  href={bookingTarget}
                  variant={item.featured ? "primary" : "secondary"}
                  fullWidth
                >
                  {ui.buttons.book}
                </Button>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
