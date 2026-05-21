import { useEffect, useRef, useState } from "react";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import { getBookingTarget } from "../../lib/booking/getBookingTarget";
import {
  getPublicPricingPackagePlans,
  getPublicPricingServices,
  type PublicPricingPackagePlan,
  type PublicPricingService,
} from "../../lib/services/getPublicPricingServices";

import styles from "./Pricing.module.css";

type PricingCard = {
  id: string;
  title: string;
  price: string;
  description: string;
  durationMinutes?: number;
  featured?: boolean;
};

type PackagePricingCard = {
  id: string;
  packagePlanId: number;
  title: string;
  price: string;
  pricePerSession: string;
  description: string;
  sessionsCount: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  featured?: boolean;
};

type PricingCopy = {
  loading: string;
  empty: string;
  errorFallback: string;
  durationLabel: string;
  packageSectionTitle: string;
  packageSectionDescription: string;
  packageSessionsLabel: string;
  packageBaseServiceLabel: string;
  packagePerSessionLabel: string;
  packageButton: string;
};

const pricingCopyByLanguage: Record<"ru" | "en", PricingCopy> = {
  ru: {
    loading: "Загружаем актуальные услуги...",
    empty: "Сейчас нет активных услуг для публичного прайса.",
    errorFallback: "Не удалось загрузить услуги для публичного прайса.",
    durationLabel: "мин",
    packageSectionTitle: "Пакеты консультаций",
    packageSectionDescription:
      "Можно выбрать пакет из нескольких сессий по отдельной цене. После оплаты клиент получает код, по которому сможет записываться на консультации.",
    packageSessionsLabel: "сессий в пакете",
    packageBaseServiceLabel: "Базовая услуга",
    packagePerSessionLabel: "≈ за сессию",
    packageButton: "Купить пакет",
  },
  en: {
    loading: "Loading current services...",
    empty: "There are no active services for public pricing right now.",
    errorFallback: "Failed to load services for public pricing.",
    durationLabel: "min",
    packageSectionTitle: "Consultation packages",
    packageSectionDescription:
      "Choose a multi-session package at a separate price. After payment, the client receives a code to book sessions with it.",
    packageSessionsLabel: "sessions in package",
    packageBaseServiceLabel: "Base service",
    packagePerSessionLabel: "≈ per session",
    packageButton: "Buy package",
  },
};

function formatServicePrice(value: number, language: "ru" | "en"): string {
  return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPackagePurchaseTarget(packagePlanId: number): string {
  return `/book?mode=buy-package&packagePlanId=${packagePlanId}`;
}

function mapPricingCards(
  services: PublicPricingService[],
  currentLanguage: "ru" | "en"
): PricingCard[] {
  return services.map((item, index) => ({
    id: item.id,
    title: item.title,
    price: formatServicePrice(item.price, currentLanguage),
    description: item.description?.trim() || "",
    durationMinutes: item.durationMinutes,
    featured: index === 0,
  }));
}

function mapPackagePricingCards(
  packagePlans: PublicPricingPackagePlan[],
  currentLanguage: "ru" | "en"
): PackagePricingCard[] {
  return packagePlans.map((item, index) => {
    const pricePerSession =
      item.sessionsCount > 0 ? item.price / item.sessionsCount : item.price;

    return {
      id: item.id,
      packagePlanId: item.packagePlanId,
      title: item.title,
      price: formatServicePrice(item.price, currentLanguage),
      pricePerSession: formatServicePrice(pricePerSession, currentLanguage),
      description: item.description?.trim() || "",
      sessionsCount: item.sessionsCount,
      serviceTitle: item.serviceTitle,
      serviceDurationMinutes: item.serviceDurationMinutes,
      featured: index === 0,
    };
  });
}

export function Pricing() {
  const { language, t } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const copy = pricingCopyByLanguage[currentLanguage];

  const bookingTarget = getBookingTarget();

  const [services, setServices] = useState<PublicPricingService[]>([]);
  const [packagePlans, setPackagePlans] = useState<PublicPricingPackagePlan[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const serviceCardsRef = useRef<HTMLElement[]>([]);
  const packageCardsRef = useRef<HTMLElement[]>([]);

  const pricingCards = mapPricingCards(services, currentLanguage);
  const packagePricingCards = mapPackagePricingCards(
    packagePlans,
    currentLanguage
  );

  const canShowPackagePlans =
    siteSettings.servicePackages.enabled &&
    siteSettings.servicePackages.publicPricingEnabled &&
    packagePricingCards.length > 0;

  useEffect(() => {
    let isActive = true;

    async function loadPricingData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [serviceItems, packageItems] = await Promise.all([
          getPublicPricingServices(),
          getPublicPricingPackagePlans(),
        ]);

        if (!isActive) return;

        setServices(serviceItems);
        setPackagePlans(
          siteSettings.servicePackages.enabled &&
            siteSettings.servicePackages.publicPricingEnabled
            ? packageItems
            : []
        );
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

    void loadPricingData();

    return () => {
      isActive = false;
    };
  }, [copy.errorFallback]);

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

    const observedCards = [
      ...serviceCardsRef.current,
      ...packageCardsRef.current,
    ].filter(Boolean);

    observedCards.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [services, packagePlans]);

  return (
    <section id="pricing" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={t.content.pricing.eyebrow}
          title={t.content.pricing.title}
          description={t.content.pricing.description}
        />

        {isLoading && <div className={styles.stateBox}>{copy.loading}</div>}

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
                    serviceCardsRef.current[index] = el;
                  }
                }}
                className={`${styles.card} ${
                  item.featured ? styles.featured : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.price}>{item.price}</p>

                  {item.durationMinutes ? (
                    <p className={styles.duration}>
                      {item.durationMinutes} {copy.durationLabel}
                    </p>
                  ) : null}
                </div>

                <p className={styles.description}>{item.description}</p>

                <Button href={bookingTarget} variant="premium" fullWidth>
                  {t.ui.buttons.book}
                </Button>
              </article>
            ))}
          </div>
        )}

        {!isLoading && !loadError && canShowPackagePlans ? (
          <div className={styles.packageSection}>
            <div className={styles.packageSectionHeader}>
              <h3 className={styles.packageSectionTitle}>
                {copy.packageSectionTitle}
              </h3>
              <p className={styles.packageSectionDescription}>
                {copy.packageSectionDescription}
              </p>
            </div>

            <div className={styles.packageGrid}>
              {packagePricingCards.map((item, index) => (
                <article
                  key={item.id}
                  ref={(el) => {
                    if (el) {
                      packageCardsRef.current[index] = el;
                    }
                  }}
                  className={`${styles.card} ${styles.packageCard} ${
                    item.featured ? styles.packageFeatured : ""
                  }`}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.packageBadge}>
                      {item.sessionsCount} {copy.packageSessionsLabel}
                    </div>

                    <h3 className={styles.cardTitle}>{item.title}</h3>

                    <p className={styles.price}>{item.price}</p>

                    <p className={styles.duration}>
                      {item.pricePerSession} {copy.packagePerSessionLabel}
                    </p>
                  </div>

                  <div className={styles.packageMeta}>
                    <span>
                      {copy.packageBaseServiceLabel}: {item.serviceTitle}
                    </span>
                    <span>
                      {item.serviceDurationMinutes} {copy.durationLabel}
                    </span>
                  </div>

                  <p className={styles.description}>{item.description}</p>

                  <Button
                    href={getPackagePurchaseTarget(item.packagePlanId)}
                    variant="premium"
                    fullWidth
                  >
                    {copy.packageButton}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}