import type {
  ClientReviewCreatePayload,
  ClientReviewCreateSuccessResponse,
  ClientReviewErrorResponse,
  ClientReviewListPageOptions,
  ClientReviewListPageResult,
  ClientReviewListSuccessResponse,
  ClientReviewPublicRecord,
} from "../../types/reviews";

export async function getPublishedClientReviewsPage(
  options: ClientReviewListPageOptions = {}
): Promise<ClientReviewListPageResult> {
  const params = new URLSearchParams({
    action: "list-reviews",
  });

  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }

  if (typeof options.offset === "number") {
    params.set("offset", String(options.offset));
  }

  const response = await fetch(`/api/requests/create?${params.toString()}`);

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
    return {
      items: data.items,
      hasMore: data.hasMore === true,
    };
  }

  return {
    items: [],
    hasMore: false,
  };
}

export async function getPublishedClientReviews(
  options: ClientReviewListPageOptions = {}
): Promise<ClientReviewPublicRecord[]> {
  const result = await getPublishedClientReviewsPage(options);

  return result.items;
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