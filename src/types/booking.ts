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

