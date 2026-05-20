import type { PublicBookingCreatePayload } from "../../types/booking";
import type { PreferredContactMethod } from "../../types/preferredContact";

export type PaymentKind = "booking" | "service_package";

export type CreatePaymentResponse = {
  requestId: string;
  confirmationUrl: string;
};

export type CreateBookingPaymentPayload = PublicBookingCreatePayload & {
  requestId: string;
  paymentKind?: "booking";
};

export type CreateServicePackagePaymentPayload = {
  requestId: string;
  paymentKind: "service_package";
  packagePlanId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  preferredContactMethod?: PreferredContactMethod | "";
  preferredContactValue?: string;
  consent: boolean;
};

export type CreatePaymentPayload =
  | CreateBookingPaymentPayload
  | CreateServicePackagePaymentPayload;

export type PaymentStatusResponse = {
  requestId: string;
  paymentKind: PaymentKind;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  amount: number;
  currency: string;
  sessionId: number | null;
  clientPackageId: number | null;
  errorMessage: string | null;
  paidAt: string | null;
  timezone: string;
  booking: {
    startsAt: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  servicePackage: {
    packagePlanId: number | null;
    packageTitle: string;
    serviceTitle: string;
    sessionsCount: number | null;
    code: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

export async function createPayment(
  payload: CreatePaymentPayload
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