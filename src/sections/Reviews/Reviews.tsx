import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import type { ReviewItem } from "../../types/reviews";
import styles from "./Reviews.module.css";

function getVisibleCount(width: number) {
  if (width >= 1100) {
    return 3;
  }

  if (width >= 700) {
    return 2;
  }

  return 1;
}

export function Reviews() {
  const { t, language } = useLanguage();
  const { content } = t;

  if (!siteSettings.sections.reviews.enabled) {
    return null;
  }

  const items = useMemo(
    () => content.reviews.items as ReviewItem[],
    [content.reviews.items]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window === "undefined" ? 1 : getVisibleCount(window.innerWidth)
  );

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!items.length) {
    return null;
  }

  const actualVisibleCount = Math.min(visibleCount, items.length);
  const maxIndex = Math.max(0, items.length - actualVisibleCount);
  const hasNavigation = items.length > actualVisibleCount;
  const pageCount = maxIndex + 1;
  const slideWidthPercent = 100 / actualVisibleCount;

  useEffect(() => {
    if (activeIndex > maxIndex) {
      setActiveIndex(maxIndex);
    }
  }, [activeIndex, maxIndex]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return;
    }

    const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (!hasNavigation) {
      touchStartXRef.current = null;
      touchDeltaXRef.current = 0;
      return;
    }

    const threshold = 50;

    if (touchDeltaXRef.current <= -threshold) {
      goNext();
    } else if (touchDeltaXRef.current >= threshold) {
      goPrev();
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const prevLabel =
    language === "ru" ? "Предыдущие отзывы" : "Previous reviews";
  const nextLabel =
    language === "ru" ? "Следующие отзывы" : "Next reviews";
  const dotLabelPrefix =
    language === "ru" ? "Перейти к слайду" : "Go to slide";

  return (
    <section id="reviews" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.reviews.eyebrow}
          title={content.reviews.title}
          description={content.reviews.description}
        />

        <div className={styles.carouselShell}>
          {hasNavigation ? (
            <button
              type="button"
              className={`${styles.controlButton} ${styles.controlButtonLeft}`}
              onClick={goPrev}
              aria-label={prevLabel}
            >
              <ChevronLeft size={18} />
            </button>
          ) : null}

          <div
            className={styles.carousel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={styles.track}
              style={{
                transform: `translateX(-${activeIndex * slideWidthPercent}%)`,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.image}
                  className={styles.slide}
                  style={{ flex: `0 0 ${slideWidthPercent}%` }}
                >
                  <div className={styles.card}>
                    <img
                      src={item.image}
                      alt={item.alt}
                      className={styles.image}
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasNavigation ? (
            <button
              type="button"
              className={`${styles.controlButton} ${styles.controlButtonRight}`}
              onClick={goNext}
              aria-label={nextLabel}
            >
              <ChevronRight size={18} />
            </button>
          ) : null}
        </div>

        {hasNavigation ? (
          <div className={styles.dots}>
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`${dotLabelPrefix} ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}