import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

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

import { pricingCopyByLanguage } from "./pricing.copy";
import styles from "./Pricing.module.css";

type PricingCard = {
  id: string;
  title: string;
  price: string;
  description: string;
  durationMinutes?: number;
  featured?: boolean;
};

type PackagePricingOption = {
  id: string;
  packagePlanId: number;
  title: string;
  description: string;
  sessionsCount: number;
  price: string;
  pricePerSession: string;
};

type PackagePricingGroup = {
  id: string;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  options: PackagePricingOption[];
  featured?: boolean;
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

function mapPackagePricingGroups(
  packagePlans: PublicPricingPackagePlan[],
  currentLanguage: "ru" | "en"
): PackagePricingGroup[] {
  const groupsByService = new Map<number, PackagePricingGroup>();

  packagePlans.forEach((item) => {
    const currentGroup = groupsByService.get(item.serviceId);

    const pricePerSession =
      item.sessionsCount > 0 ? item.price / item.sessionsCount : item.price;

    const option: PackagePricingOption = {
      id: item.id,
      packagePlanId: item.packagePlanId,
      title: item.title,
      description: item.description?.trim() || "",
      sessionsCount: item.sessionsCount,
      price: formatServicePrice(item.price, currentLanguage),
      pricePerSession: formatServicePrice(pricePerSession, currentLanguage),
    };

    if (currentGroup) {
      currentGroup.options.push(option);
      return;
    }

    groupsByService.set(item.serviceId, {
      id: `service-package-group-${item.serviceId}`,
      serviceId: item.serviceId,
      serviceTitle: item.serviceTitle,
      serviceDurationMinutes: item.serviceDurationMinutes,
      options: [option],
    });
  });

  return Array.from(groupsByService.values()).map((group, index) => ({
    ...group,
    featured: index === 0,
    options: [...group.options].sort(
      (first, second) => first.sessionsCount - second.sessionsCount
    ),
  }));
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
  const packageGroupCardsRef = useRef<HTMLElement[]>([]);

  const pricingCards = mapPricingCards(services, currentLanguage);
  const packagePricingGroups = mapPackagePricingGroups(
    packagePlans,
    currentLanguage
  );

  const canShowPackagePlans =
    siteSettings.servicePackages.enabled &&
    siteSettings.servicePackages.publicPricingEnabled &&
    packagePricingGroups.length > 0;

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
      ...packageGroupCardsRef.current,
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
              {packagePricingGroups.map((group, index) => (
                <article
                  key={group.id}
                  ref={(el) => {
                    if (el) {
                      packageGroupCardsRef.current[index] = el;
                    }
                  }}
                  className={`${styles.card} ${styles.packageCard} ${
                    group.featured ? styles.packageFeatured : ""
                  }`}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.packageBadge}>
                      {copy.packageBaseServiceLabel}
                    </div>

                    <h3 className={styles.cardTitle}>
                      {copy.packageCardTitlePrefix} {group.serviceTitle}
                    </h3>

                    <p className={styles.duration}>
                      {group.serviceDurationMinutes} {copy.durationLabel}
                    </p>
                  </div>

                  <div className={styles.packageOptions}>
                    {group.options.map((option) => (
                      <Link
                        key={option.id}
                        to={getPackagePurchaseTarget(option.packagePlanId)}
                        className={styles.packageOption}
                      >
                        <div className={styles.packageOptionText}>
                          <strong className={styles.packageOptionTitle}>
                            {option.sessionsCount} {copy.packageSessionsLabel}
                          </strong>

                          {option.description ? (
                            <span className={styles.packageOptionDescription}>
                              {option.description}
                            </span>
                          ) : (
                            <span className={styles.packageOptionDescription}>
                              {option.title}
                            </span>
                          )}
                        </div>

                        <div className={styles.packageOptionBuy}>
                          <div className={styles.packageOptionPrice}>
                            <strong>{option.price}</strong>
                            <span>
                              {option.pricePerSession}{" "}
                              {copy.packagePerSessionLabel}
                            </span>
                          </div>

                          <span className={styles.packageOptionButton}>
                            {copy.packageButton}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}