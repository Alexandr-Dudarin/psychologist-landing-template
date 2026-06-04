import type {
  ClientReviewCreatePayload,
  ClientReviewCreateSuccessResponse,
  ClientReviewErrorResponse,
  ClientReviewListSuccessResponse,
  ClientReviewPublicRecord,
} from "../../types/reviews";

export async function getPublishedClientReviews(): Promise<
  ClientReviewPublicRecord[]
> {
  const response = await fetch("/api/requests/create?action=list-reviews");

  const data = (await response.json().catch(() => null)) as
    | ClientReviewListSuccessResponse
    | ClientReviewErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить отзывы"
    );
  }

  if (data && "items" in data) {
    return data.items;
  }

  return [];
}

export async function createClientReview(
  payload: ClientReviewCreatePayload
): Promise<ClientReviewCreateSuccessResponse> {
  const response = await fetch("/api/requests/create?action=create-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | ClientReviewCreateSuccessResponse
    | ClientReviewErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось отправить отзыв"
    );
  }

  if (data && "success" in data) {
    return data;
  }

  throw new Error("Не удалось отправить отзыв");
}