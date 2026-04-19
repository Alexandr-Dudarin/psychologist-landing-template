import type { CrmServiceRecord } from "./service";

export type PublicBookingService = Pick<
  CrmServiceRecord,
  "id" | "title" | "description" | "price" | "durationMinutes"
>;

export type PublicBookingSlot = {
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
};

export type PublicBookingAvailabilityResponse = {
  services: PublicBookingService[];
  selectedServiceId: number | null;
  selectedDate: string | null;
  dateBounds: {
    min: string;
    max: string;
  };
  slotStepMinutes: number;
  slots: PublicBookingSlot[];
};

export type PublicBookingCreatePayload = {
  serviceId: number;
  startsAt: string;
  name: string;
  phone: string;
  email: string;
  message?: string;
  consent: boolean;
};

export type PublicBookingCreateSuccessResponse = {
  success: true;
  booking: {
    sessionId: number;
    clientId: number;
    serviceId: number;
    serviceTitle: string;
    startsAt: string;
    endsAt: string;
  };
  alreadyExistedClient: boolean;
};

export type PublicBookingCreateErrorResponse = {
  error: string;
  code?:
    | "invalid_payload"
    | "invalid_service"
    | "invalid_slot"
    | "slot_unavailable"
    | "settings_missing"
    | "booking_create_failed";
};

