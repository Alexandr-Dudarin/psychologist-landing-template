import type {
  PublicBookingAvailabilityResponse,
  PublicBookingCreateErrorResponse,
  PublicBookingCreatePayload,
  PublicBookingCreateSuccessResponse,
} from "../../types/booking";

type PublicBookingAvailabilityParams = {
  serviceId?: number;
  date?: string;
  month?: string;
};

type PublicBookingAvailabilityErrorResponse = {
  error: string;
};

type PublicBookingError = Error & {
  code?: string;
  status?: number;
};

export async function getPublicBookingAvailability(
  params: PublicBookingAvailabilityParams = {}
): Promise<PublicBookingAvailabilityResponse> {
  const searchParams = new URLSearchParams();

  if (params.serviceId) {
    searchParams.set("serviceId", String(params.serviceId));
  }

  if (params.date) {
    searchParams.set("date", params.date);
  }

  if (params.month) {
    searchParams.set("month", params.month);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/public/booking?${queryString}`
    : "/api/public/booking";

  const response = await fetch(url);
  const data = (await response.json().catch(() => null)) as
    | PublicBookingAvailabilityResponse
    | PublicBookingAvailabilityErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data ? data.error : "Не удалось загрузить доступность"
    );
  }

  return data as PublicBookingAvailabilityResponse;
}

export async function createPublicBooking(
  payload: PublicBookingCreatePayload
): Promise<PublicBookingCreateSuccessResponse> {
  const response = await fetch("/api/public/booking?action=create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | PublicBookingCreateSuccessResponse
    | PublicBookingCreateErrorResponse
    | null;

  if (!response.ok) {
    const error = new Error(
      data && "error" in data ? data.error : "Не удалось создать запись"
    ) as PublicBookingError;

    if (data && "code" in data && typeof data.code === "string") {
      error.code = data.code;
    }

    error.status = response.status;
    throw error;
  }

  return data as PublicBookingCreateSuccessResponse;
}

