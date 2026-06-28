import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import { getPublishedClientReviewsPage } from "../../lib/api/clientReviews";
import type { ClientReviewPublicRecord, ReviewItem } from "../../types/reviews";
import {
  reviewsCopyByLanguage,
  type ReviewsSectionCopy,
} from "./reviews.copy";
import styles from "./Reviews.module.css";

const CLIENT_REVIEW_TEXT_LIMIT_DESKTOP = 450;
const CLIENT_REVIEW_TEXT_LIMIT_MOBILE = 200;
const CLIENT_REVIEWS_INITIAL_LIMIT = 6;
const CLIENT_REVIEWS_LOAD_MORE_LIMIT = 3;

function getVisibleCount(width: number, height: number) {
  if (width >= 980 && height <= 720) {
    return 3;
  }

  if (width >= 1100) {
    return 3;
  }

  if (width >= 700) {
    return 2;
  }

  return 1;
}

function getClientReviewsVisibleCount(width: number) {
  if (width >= 1100) {
    return 3;
  }

  if (width >= 700) {
    return 2;
  }

  return 1;
}

function getClientReviewTextLimit(width: number) {
  if (width <= 700) {
    return CLIENT_REVIEW_TEXT_LIMIT_MOBILE;
  }

  return CLIENT_REVIEW_TEXT_LIMIT_DESKTOP;
}

function getPublicReviewName(
  review: ClientReviewPublicRecord,
  anonymousReviewName: string
) {
  return review.publicName.trim() || anonymousReviewName;
}

function getReviewRatingLabel(rating: number | null, noRatingLabel: string) {
  if (rating === null) {
    return noRatingLabel;
  }

  return `${rating} / 5`;
}

function formatReviewDate(value: string, language: "ru" | "en") {
  return new Date(value).toLocaleDateString(
    language === "ru" ? "ru-RU" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function getPreviewText(text: string, limit: number) {
  const normalizedText = text.trim();

  if (normalizedText.length <= limit) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, limit).trimEnd()}…`;
}

type ImageReviewsCarouselProps = {
  items: ReviewItem[];
  copy: ReviewsSectionCopy;
};

function ImageReviewsCarousel({ items, copy }: ImageReviewsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window === "undefined"
      ? 1
      : getVisibleCount(window.innerWidth, window.innerHeight)
  );

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const lightboxTouchStartXRef = useRef<number | null>(null);
  const lightboxTouchDeltaXRef = useRef(0);

  const actualVisibleCount = Math.min(visibleCount, items.length);
  const maxIndex = Math.max(0, items.length - actualVisibleCount);
  const hasNavigation = items.length > actualVisibleCount;
  const pageCount = maxIndex + 1;
  const slideWidthPercent = 100 / actualVisibleCount;

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount(window.innerWidth, window.innerHeight));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (activeIndex > maxIndex) {
      setActiveIndex(maxIndex);
    }
  }, [activeIndex, maxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null ? prev : prev === 0 ? items.length - 1 : prev - 1
        );
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === null ? prev : prev === items.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [items.length, lightboxIndex]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
  };

  const goLightboxPrev = () => {
    setLightboxIndex((prev) =>
      prev === null ? prev : prev === 0 ? items.length - 1 : prev - 1
    );
  };

  const goLightboxNext = () => {
    setLightboxIndex((prev) =>
      prev === null ? prev : prev === items.length - 1 ? 0 : prev + 1
    );
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

  const handleLightboxTouchStart = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    lightboxTouchStartXRef.current = event.touches[0]?.clientX ?? null;
    lightboxTouchDeltaXRef.current = 0;
  };

  const handleLightboxTouchMove = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (lightboxTouchStartXRef.current === null) {
      return;
    }

    const currentX =
      event.touches[0]?.clientX ?? lightboxTouchStartXRef.current;

    lightboxTouchDeltaXRef.current =
      currentX - lightboxTouchStartXRef.current;
  };

  const handleLightboxTouchEnd = () => {
    if (items.length <= 1) {
      lightboxTouchStartXRef.current = null;
      lightboxTouchDeltaXRef.current = 0;
      return;
    }

    const threshold = 50;

    if (lightboxTouchDeltaXRef.current <= -threshold) {
      goLightboxNext();
    } else if (lightboxTouchDeltaXRef.current >= threshold) {
      goLightboxPrev();
    }

    lightboxTouchStartXRef.current = null;
    lightboxTouchDeltaXRef.current = 0;
  };

  return (
    <>
      <div className={styles.carouselShell}>
        {hasNavigation ? (
          <button
            type="button"
            className={`${styles.controlButton} ${styles.controlButtonLeft}`}
            onClick={goPrev}
            aria-label={copy.imagePrevLabel}
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
            {items.map((item, index) => (
              <div
                key={item.image}
                className={styles.slide}
                style={{ flex: `0 0 ${slideWidthPercent}%` }}
              >
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.innerWidth <= 560
                    ) {
                      return;
                    }

                    setLightboxIndex(index);
                  }}
                  aria-label={copy.imageOpenLabel}
                >
                  <img
                    src={item.image}
                    alt={item.alt}
                    className={styles.image}
                    loading="lazy"
                  />

                  <span className={styles.zoomHint} aria-hidden="true">
                    <Search size={18} />
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {hasNavigation ? (
          <button
            type="button"
            className={`${styles.controlButton} ${styles.controlButtonRight}`}
            onClick={goNext}
            aria-label={copy.imageNextLabel}
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
              className={`${styles.dot} ${
                index === activeIndex ? styles.dotActive : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`${copy.imageDotLabelPrefix} ${index + 1}`}
              aria-current={index === activeIndex ? "page" : undefined}
            />
          ))}
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={copy.imageOpenLabel}
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className={styles.lightboxInner}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setLightboxIndex(null)}
              aria-label={copy.imageCloseLabel}
            >
              <X size={18} />
            </button>

            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.lightboxControl} ${styles.lightboxControlLeft}`}
                  onClick={goLightboxPrev}
                  aria-label={copy.imagePrevLabel}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  className={`${styles.lightboxControl} ${styles.lightboxControlRight}`}
                  onClick={goLightboxNext}
                  aria-label={copy.imageNextLabel}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            ) : null}

            <img
              src={items[lightboxIndex].image}
              alt={items[lightboxIndex].alt}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

type ClientReviewsPreviewProps = {
  items: ClientReviewPublicRecord[];
  language: "ru" | "en";
  copy: ReviewsSectionCopy;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

function ClientReviewsPreview({
  items,
  language,
  copy,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ClientReviewsPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window === "undefined"
      ? 1
      : getClientReviewsVisibleCount(window.innerWidth)
  );
  const [textLimit, setTextLimit] = useState(() =>
    typeof window === "undefined"
      ? CLIENT_REVIEW_TEXT_LIMIT_DESKTOP
      : getClientReviewTextLimit(window.innerWidth)
  );
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<number>>(
    () => new Set()
  );

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const actualVisibleCount = Math.min(visibleCount, items.length);
  const maxIndex = Math.max(0, items.length - actualVisibleCount);
  const hasNavigation = items.length > actualVisibleCount;
  const pageCount = maxIndex + 1;
  const slideWidthPercent = 100 / actualVisibleCount;
  const isSingleReview = items.length === 1;

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getClientReviewsVisibleCount(window.innerWidth));
      setTextLimit(getClientReviewTextLimit(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (activeIndex > maxIndex) {
      setActiveIndex(maxIndex);
    }
  }, [activeIndex, maxIndex]);

  useEffect(() => {
    if (!hasNavigation || !hasMore || isLoadingMore) {
      return;
    }

    const loadMoreStartIndex = Math.max(
      0,
      items.length - CLIENT_REVIEWS_LOAD_MORE_LIMIT
    );

    if (activeIndex >= loadMoreStartIndex) {
      onLoadMore();
    }
  }, [
    activeIndex,
    hasMore,
    hasNavigation,
    isLoadingMore,
    items.length,
    onLoadMore,
  ]);

  const goPrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => Math.min(maxIndex, prev + 1));
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

    if (touchDeltaXRef.current <= -threshold && activeIndex < maxIndex) {
      goNext();
    } else if (touchDeltaXRef.current >= threshold && activeIndex > 0) {
      goPrev();
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const toggleExpandedReview = (reviewId: number) => {
    setExpandedReviewIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(reviewId)) {
        nextIds.delete(reviewId);
      } else {
        nextIds.add(reviewId);
      }

      return nextIds;
    });
  };

  return (
    <>
      <div
        className={`${styles.clientReviewsCarouselShell} ${
          isSingleReview ? styles.clientReviewsCarouselShellSingle : ""
        }`}
      >
        {hasNavigation && activeIndex > 0 ? (
          <button
            type="button"
            className={`${styles.clientReviewsControlButton} ${styles.clientReviewsControlButtonLeft}`}
            onClick={goPrev}
            aria-label={copy.clientPrevLabel}
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}

        <div
          className={styles.clientReviewsCarousel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={styles.clientReviewsTrack}
            style={{
              transform: `translateX(-${activeIndex * slideWidthPercent}%)`,
            }}
          >
            {items.map((review) => {
              const isExpanded = expandedReviewIds.has(review.id);
              const isLongReview = review.text.trim().length > textLimit;
              const reviewText =
                isExpanded || !isLongReview
                  ? review.text.trim()
                  : getPreviewText(review.text, textLimit);
              const reviewTextId = `client-review-text-${review.id}`;

              return (
                <div
                  key={review.id}
                  className={styles.clientReviewSlide}
                  style={{ flex: `0 0 ${slideWidthPercent}%` }}
                >
                  <article className={styles.clientReviewCard}>
                    <div className={styles.clientReviewHeader}>
                      <h3 className={styles.clientReviewName}>
                        {getPublicReviewName(
                          review,
                          copy.anonymousReviewName
                        )}
                      </h3>

                      <span
                        className={
                          review.rating === null
                            ? styles.clientReviewRatingEmpty
                            : styles.clientReviewRating
                        }
                      >
                        {getReviewRatingLabel(
                          review.rating,
                          copy.noRatingLabel
                        )}
                      </span>
                    </div>

                    <div className={styles.clientReviewTextBlock}>
                      <p id={reviewTextId} className={styles.clientReviewText}>
                        {reviewText}
                      </p>

                      {isLongReview ? (
                        <button
                          type="button"
                          className={styles.clientReviewMoreButton}
                          onClick={() => toggleExpandedReview(review.id)}
                          aria-expanded={isExpanded}
                          aria-controls={reviewTextId}
                        >
                          {isExpanded ? copy.collapseLabel : copy.moreLabel}
                        </button>
                      ) : null}
                    </div>

                    <time
                      className={styles.clientReviewDate}
                      dateTime={review.publishedAt ?? review.createdAt}
                    >
                      {formatReviewDate(
                        review.publishedAt ?? review.createdAt,
                        language
                      )}
                    </time>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {hasNavigation && activeIndex < maxIndex ? (
          <button
            type="button"
            className={`${styles.clientReviewsControlButton} ${styles.clientReviewsControlButtonRight}`}
            onClick={goNext}
            aria-label={copy.clientNextLabel}
          >
            <ChevronRight size={18} />
          </button>
        ) : null}
      </div>

      {hasNavigation ? (
        <div className={styles.clientReviewsDots}>
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={`${styles.clientReviewsDot} ${
                index === activeIndex ? styles.clientReviewsDotActive : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`${copy.clientDotLabelPrefix} ${index + 1}`}
              aria-current={index === activeIndex ? "page" : undefined}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

export function Reviews() {
  const { t, language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "ru";
  const copy = reviewsCopyByLanguage[currentLanguage];
  const { content } = t;

  const imageItems = useMemo(
    () => content.reviews.items as ReviewItem[],
    [content.reviews.items]
  );

  const [clientReviewItems, setClientReviewItems] = useState<
    ClientReviewPublicRecord[]
  >([]);
  const [isClientReviewsLoading, setIsClientReviewsLoading] = useState(false);
  const [isClientReviewsLoadingMore, setIsClientReviewsLoadingMore] =
    useState(false);
  const [clientReviewsHasMore, setClientReviewsHasMore] = useState(false);
  const [clientReviewsError, setClientReviewsError] = useState("");

  const reviewsSettings = siteSettings.sections.reviews;
  const reviewsMode = reviewsSettings.mode;

  const shouldShowImageReviews =
    reviewsSettings.imageReviewsEnabled &&
    (reviewsMode === "images" || reviewsMode === "mixed") &&
    imageItems.length > 0;

  const shouldShowClientReviews =
    siteSettings.clientReviews.enabled &&
    siteSettings.clientReviews.publicListEnabled &&
    reviewsSettings.clientReviewsEnabled &&
    (reviewsMode === "client_reviews" || reviewsMode === "mixed");

  const shouldShowReviewFormLink =
    siteSettings.clientReviews.enabled &&
    siteSettings.clientReviews.publicFormEnabled &&
    reviewsSettings.clientReviewFormLinkEnabled;

  const hasClientReviews = clientReviewItems.length > 0;

  const loadMoreClientReviews = useCallback(async () => {
    if (
      isClientReviewsLoading ||
      isClientReviewsLoadingMore ||
      !clientReviewsHasMore
    ) {
      return;
    }

    try {
      setIsClientReviewsLoadingMore(true);
      setClientReviewsError("");

      const result = await getPublishedClientReviewsPage({
        limit: CLIENT_REVIEWS_LOAD_MORE_LIMIT,
        offset: clientReviewItems.length,
      });

      setClientReviewItems((currentItems) => {
        const existingIds = new Set(currentItems.map((item) => item.id));
        const newItems = result.items.filter((item) => !existingIds.has(item.id));

        return [...currentItems, ...newItems];
      });

      setClientReviewsHasMore(result.hasMore);
    } catch {
      setClientReviewsError(copy.loadError);
    } finally {
      setIsClientReviewsLoadingMore(false);
    }
  }, [
    clientReviewItems.length,
    clientReviewsHasMore,
    copy.loadError,
    isClientReviewsLoading,
    isClientReviewsLoadingMore,
  ]);

  useEffect(() => {
    if (!shouldShowClientReviews) {
      setClientReviewItems([]);
      setIsClientReviewsLoading(false);
      setIsClientReviewsLoadingMore(false);
      setClientReviewsHasMore(false);
      setClientReviewsError("");
      return;
    }

    let isMounted = true;

    async function loadClientReviews() {
      try {
        setIsClientReviewsLoading(true);
        setIsClientReviewsLoadingMore(false);
        setClientReviewsHasMore(false);
        setClientReviewsError("");

        const result = await getPublishedClientReviewsPage({
          limit: CLIENT_REVIEWS_INITIAL_LIMIT,
          offset: 0,
        });

        if (isMounted) {
          setClientReviewItems(result.items);
          setClientReviewsHasMore(result.hasMore);
        }
      } catch {
        if (isMounted) {
          setClientReviewsHasMore(false);
          setClientReviewsError(copy.loadError);
        }
      } finally {
        if (isMounted) {
          setIsClientReviewsLoading(false);
        }
      }
    }

    loadClientReviews();

    return () => {
      isMounted = false;
    };
  }, [copy.loadError, shouldShowClientReviews]);

  if (!reviewsSettings.enabled) {
    return null;
  }

  const shouldRenderSection =
    shouldShowImageReviews ||
    shouldShowClientReviews ||
    shouldShowReviewFormLink;

  if (!shouldRenderSection) {
    return null;
  }

  return (
    <section id="reviews" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.reviews.eyebrow}
          title={content.reviews.title}
          description={content.reviews.description}
        />

        <div className={styles.contentStack}>
          {shouldShowClientReviews ? (
            <div className={styles.clientReviewsBlock}>
              {isClientReviewsLoading ? (
                <div
                  className={styles.clientReviewsState}
                  role="status"
                  aria-live="polite"
                >
                  {copy.loadingLabel}
                </div>
              ) : null}

              {!isClientReviewsLoading && clientReviewsError ? (
                <div className={styles.clientReviewsState} role="alert">
                  {copy.errorLabel}
                </div>
              ) : null}

              {!isClientReviewsLoading &&
              !clientReviewsError &&
              !hasClientReviews ? (
                <div className={styles.clientReviewsState}>
                  {copy.emptyLabel}
                </div>
              ) : null}

              {hasClientReviews ? (
                <ClientReviewsPreview
                  items={clientReviewItems}
                  language={currentLanguage}
                  copy={copy}
                  hasMore={clientReviewsHasMore}
                  isLoadingMore={isClientReviewsLoadingMore}
                  onLoadMore={loadMoreClientReviews}
                />
              ) : null}
            </div>
          ) : null}

          {shouldShowImageReviews ? (
            <ImageReviewsCarousel items={imageItems} copy={copy} />
          ) : null}

          {shouldShowReviewFormLink ? (
            <div className={styles.reviewFormCta}>
              <p>{copy.formLinkHint}</p>

              <Link to="/reviews" className={styles.reviewFormButton}>
                {copy.leaveReviewLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}