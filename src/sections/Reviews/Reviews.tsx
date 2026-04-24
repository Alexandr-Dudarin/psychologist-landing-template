import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import type { ReviewItem } from "../../types/reviews";
import styles from "./Reviews.module.css";

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
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  if (!items.length) {
    return null;
  }

  const hasMultiple = items.length > 1;

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
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
    if (!hasMultiple) {
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
    language === "ru" ? "Предыдущий отзыв" : "Previous review";
  const nextLabel =
    language === "ru" ? "Следующий отзыв" : "Next review";
  const dotLabelPrefix =
    language === "ru" ? "Перейти к отзыву" : "Go to review";

  return (
    <section id="reviews" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.reviews.eyebrow}
          title={content.reviews.title}
          description={content.reviews.description}
        />

        <div className={styles.carouselShell}>
          {hasMultiple ? (
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
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {items.map((item) => (
                <div key={item.image} className={styles.slide}>
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

          {hasMultiple ? (
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

        {hasMultiple ? (
          <div className={styles.dots}>
            {items.map((item, index) => (
              <button
                key={item.image}
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