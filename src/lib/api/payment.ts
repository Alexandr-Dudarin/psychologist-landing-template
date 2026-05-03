import type { PublicBookingCreatePayload } from "../../types/booking";

export type CreatePaymentResponse = {
  requestId: string;
  confirmationUrl: string;
};

export type PaymentStatusResponse = {
  requestId: string;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  amount: number;
  currency: string;
  sessionId: number | null;
  errorMessage: string | null;
  paidAt: string | null;
  booking: {
    startsAt: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export async function createPayment(
  payload: PublicBookingCreatePayload & { requestId: string }
): Promise<CreatePaymentResponse> {
  const response = await fetch("/api/payment?action=create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message || "Failed to create payment");
  }

  return response.json();
}

export async function completeMockPayment(requestId: string) {
  const response = await fetch("/api/payment?action=mock-complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message || "Failed to complete mock payment");
  }

  return response.json();
}

export async function getPaymentStatus(
  requestId: string
): Promise<PaymentStatusResponse> {
  const response = await fetch(
    `/api/payment?action=status&requestId=${encodeURIComponent(requestId)}`
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message || "Failed to load payment status");
  }

  return response.json();
}
