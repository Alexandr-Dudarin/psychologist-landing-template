import type { PublicBookingAvailabilityResponse } from "../../types/booking";

type PublicBookingAvailabilityParams = {
  serviceId?: number;
  date?: string;
};

type PublicBookingAvailabilityErrorResponse = {
  error: string;
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

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/public/booking/availability?${queryString}`
    : "/api/public/booking/availability";

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

