import type { ClientReviewStatus } from "../../../types/reviews";

export const clientReviewStatusLabels: Record<ClientReviewStatus, string> = {
  pending: "На проверке",
  published: "Опубликован",
  hidden: "Скрыт",
  deleted: "Удалён",
};

export function getPublicReviewName(value: string): string {
  return value.trim() || "Анонимный отзыв";
}

export function getReviewRatingLabel(rating: number | null): string {
  if (rating === null) {
    return "Без оценки";
  }

  return `${rating} / 5`;
}

export function getReviewPreviewText(value: string, limit: number): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= limit) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, limit).trimEnd()}…`;
}