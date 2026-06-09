import { useEffect, useMemo, useState } from "react";

import type { ClientReviewPublicRecord } from "../../types/reviews";
import styles from "./ClientReviewsPage.module.css";

type ClientReviewsTableProps = {
  items: ClientReviewPublicRecord[];
};

const DESKTOP_REVIEW_PREVIEW_LENGTH = 450;
const MOBILE_REVIEW_PREVIEW_LENGTH = 200;
const MOBILE_REVIEW_PREVIEW_MEDIA = "(max-width: 640px)";

function getPublicReviewName(review: ClientReviewPublicRecord) {
  return review.publicName.trim() || "Анонимный отзыв";
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getReviewRatingLabel(rating: number | null) {
  if (rating === null) {
    return "Без оценки";
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

export function ClientReviewsTable({ items }: ClientReviewsTableProps) {
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
            <th className={styles.reviewAuthorCell}>Автор</th>
            <th className={styles.reviewTextCell}>Отзыв</th>
            <th className={styles.reviewRatingCell}>Оценка</th>
            <th className={styles.reviewDateCell}>Дата</th>
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
                <td className={styles.reviewAuthorCell} data-label="Автор">
                  <span className={styles.publicReviewName}>
                    {getPublicReviewName(review)}
                  </span>
                </td>

                <td className={styles.reviewTextCell} data-label="Отзыв">
                  <div className={styles.publicReviewText}>
                    <span>{visibleText}</span>

                    {isLongReview ? (
                      <button
                        type="button"
                        className={styles.publicReviewToggle}
                        onClick={() => toggleReview(review.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Свернуть ↑" : "Ещё ↓"}
                      </button>
                    ) : null}
                  </div>
                </td>

                <td className={styles.reviewRatingCell} data-label="Оценка">
                  <span
                    className={
                      review.rating === null
                        ? styles.publicReviewRatingEmpty
                        : styles.publicReviewRatingBadge
                    }
                  >
                    {getReviewRatingLabel(review.rating)}
                  </span>
                </td>

                <td className={styles.reviewDateCell} data-label="Дата">
                  <span className={styles.publicReviewDate}>
                    {formatReviewDate(review.publishedAt ?? review.createdAt)}
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