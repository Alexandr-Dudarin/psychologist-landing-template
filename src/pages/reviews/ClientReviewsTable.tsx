import { useEffect, useMemo, useState } from "react";

import type { ClientReviewPublicRecord } from "../../types/reviews";
import type { ClientReviewsTableCopy } from "./clientReviewsPage.copy";
import styles from "./ClientReviewsPage.module.css";

type ClientReviewsTableProps = {
  items: ClientReviewPublicRecord[];
  copy: ClientReviewsTableCopy;
  locale: string;
};

const DESKTOP_REVIEW_PREVIEW_LENGTH = 450;
const MOBILE_REVIEW_PREVIEW_LENGTH = 200;
const MOBILE_REVIEW_PREVIEW_MEDIA = "(max-width: 640px)";

function getPublicReviewName(
  review: ClientReviewPublicRecord,
  copy: ClientReviewsTableCopy
) {
  return review.publicName.trim() || copy.anonymousReview;
}

function formatReviewDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getReviewRatingLabel(
  rating: number | null,
  copy: ClientReviewsTableCopy
) {
  if (rating === null) {
    return copy.noRating;
  }

  return `${rating}/5`;
}

function getInitialIsMobilePreview() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_REVIEW_PREVIEW_MEDIA).matches;
}

function getReviewPreview(text: string, maxLength: number) {
  const normalizedText = text.trim();

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  const slicedText = normalizedText.slice(0, maxLength).trimEnd();
  const lastSpaceIndex = slicedText.lastIndexOf(" ");

  if (lastSpaceIndex > maxLength * 0.72) {
    return `${slicedText.slice(0, lastSpaceIndex).trimEnd()}…`;
  }

  return `${slicedText}…`;
}

function useReviewPreviewLength() {
  const [isMobilePreview, setIsMobilePreview] = useState(
    getInitialIsMobilePreview
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_REVIEW_PREVIEW_MEDIA);
    const handleChange = () => setIsMobilePreview(mediaQuery.matches);

    handleChange();

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobilePreview
    ? MOBILE_REVIEW_PREVIEW_LENGTH
    : DESKTOP_REVIEW_PREVIEW_LENGTH;
}

export function ClientReviewsTable({
  items,
  copy,
  locale,
}: ClientReviewsTableProps) {
  const previewLength = useReviewPreviewLength();
  const [expandedReviewIds, setExpandedReviewIds] = useState<
    Set<ClientReviewPublicRecord["id"]>
  >(() => new Set());

  const itemIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  useEffect(() => {
    setExpandedReviewIds((currentIds) => {
      const nextIds = new Set<ClientReviewPublicRecord["id"]>();

      currentIds.forEach((id) => {
        if (itemIds.has(id)) {
          nextIds.add(id);
        }
      });

      return nextIds;
    });
  }, [itemIds]);

  const toggleReview = (id: ClientReviewPublicRecord["id"]) => {
    setExpandedReviewIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  return (
    <div className={styles.reviewsTableShell}>
      <table className={styles.reviewsTable}>
        <thead>
          <tr>
            <th className={styles.reviewAuthorCell}>{copy.author}</th>
            <th className={styles.reviewTextCell}>{copy.review}</th>
            <th className={styles.reviewRatingCell}>{copy.rating}</th>
            <th className={styles.reviewDateCell}>{copy.date}</th>
          </tr>
        </thead>

        <tbody>
          {items.map((review) => {
            const isExpanded = expandedReviewIds.has(review.id);
            const isLongReview = review.text.trim().length > previewLength;
            const visibleText =
              isExpanded || !isLongReview
                ? review.text.trim()
                : getReviewPreview(review.text, previewLength);

            return (
              <tr key={review.id}>
                <td
                  className={styles.reviewAuthorCell}
                  data-label={copy.author}
                >
                  <span className={styles.publicReviewName}>
                    {getPublicReviewName(review, copy)}
                  </span>
                </td>

                <td className={styles.reviewTextCell} data-label={copy.review}>
                  <div className={styles.publicReviewText}>
                    <span>{visibleText}</span>

                    {isLongReview ? (
                      <button
                        type="button"
                        className={styles.publicReviewToggle}
                        onClick={() => toggleReview(review.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? copy.collapse : copy.more}
                      </button>
                    ) : null}
                  </div>
                </td>

                <td
                  className={styles.reviewRatingCell}
                  data-label={copy.rating}
                >
                  <span
                    className={
                      review.rating === null
                        ? styles.publicReviewRatingEmpty
                        : styles.publicReviewRatingBadge
                    }
                  >
                    {getReviewRatingLabel(review.rating, copy)}
                  </span>
                </td>

                <td className={styles.reviewDateCell} data-label={copy.date}>
                  <span className={styles.publicReviewDate}>
                    {formatReviewDate(
                      review.publishedAt ?? review.createdAt,
                      locale
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}