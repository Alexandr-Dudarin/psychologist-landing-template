import type {
  PublicRequestPayload,
  PublicRequestSuccessResponse,
  PublicRequestErrorResponse,
} from "../../types/request";

export async function createPublicRequest(
  payload: PublicRequestPayload
): Promise<PublicRequestSuccessResponse> {
  const response = await fetch("/api/requests/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | PublicRequestSuccessResponse
    | PublicRequestErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Request failed"
    );
  }

  return data as PublicRequestSuccessResponse;
}