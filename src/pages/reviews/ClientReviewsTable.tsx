import type { ClientReviewPublicRecord } from "../../types/reviews";
import styles from "./ClientReviewsPage.module.css";

type ClientReviewsTableProps = {
  items: ClientReviewPublicRecord[];
};

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

export function ClientReviewsTable({ items }: ClientReviewsTableProps) {
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
          {items.map((review) => (
            <tr key={review.id}>
              <td className={styles.reviewAuthorCell} data-label="Автор">
                <span className={styles.publicReviewName}>
                  {getPublicReviewName(review)}
                </span>
              </td>

              <td className={styles.reviewTextCell} data-label="Отзыв">
                <p className={styles.publicReviewText}>{review.text}</p>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}