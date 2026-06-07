import { describe, expect, it } from "vitest";

import {
  clientReviewStatusLabels,
  getReviewPreviewText,
} from "../../src/pages/admin/reviews/AdminReviewsTable.helpers";

describe("admin reviews table helpers", () => {
  it("does not truncate short review preview text", () => {
    expect(getReviewPreviewText("  Короткий отзыв  ", 40)).toBe(
      "Короткий отзыв"
    );
  });

  it("truncates long review preview text and adds an ellipsis", () => {
    expect(getReviewPreviewText("Очень полезная консультация", 12)).toBe(
      "Очень полезн…"
    );
  });

  it("handles empty and whitespace-only preview values", () => {
    expect(getReviewPreviewText("", 12)).toBe("");
    expect(getReviewPreviewText("     ", 12)).toBe("");
  });

  it("returns Russian labels for client review statuses", () => {
    expect(clientReviewStatusLabels).toEqual({
      pending: "На проверке",
      published: "Опубликован",
      hidden: "Скрыт",
      deleted: "Удалён",
    });
  });
});
