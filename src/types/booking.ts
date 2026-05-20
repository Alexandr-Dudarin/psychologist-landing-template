import type { CrmServiceRecord } from "./service.js";
import type { PreferredContactMethod } from "./preferredContact.js";

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

export type PublicBookingMonthDayState =
  | "available"
  | "unavailable"
  | "disabled";

export type PublicBookingMonthDayAvailability = {
  date: string;
  state: PublicBookingMonthDayState;
  slotCount?: number;
};

export type PublicBookingAvailabilityResponse = {
  services: PublicBookingService[];
  timezone: string;
  selectedServiceId: number | null;
  selectedDate: string | null;
  visibleMonth: string | null;
  dateBounds: {
    min: string;
    max: string;
  };
  slotStepMinutes: number;
  slots: PublicBookingSlot[];
  monthAvailability: PublicBookingMonthDayAvailability[];
};

export type PublicBookingPackageLookupPayload = {
  code: string;
  contact: string;
};

export type PublicBookingPackageInfo = {
  clientPackageId: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  preferredContactMethod: PreferredContactMethod | "";
  preferredContactValue: string;
  code: string;
  packageTitle: string;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
};

export type PublicBookingPackageLookupSuccessResponse = {
  success: true;
  package: PublicBookingPackageInfo;
};

export type PublicBookingPackageLookupErrorResponse = {
  error: string;
  code?: "invalid_payload" | "package_not_found" | "package_unavailable";
};

export type PublicBookingCreatePayload = {
  serviceId: number;
  startsAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message?: string;
  preferredContactMethod?: PreferredContactMethod | "";
  preferredContactValue?: string;
  clientPackageCode?: string;
  clientPackageContact?: string;
  consent: boolean;
};

export type PublicBookingNotificationStatus = "sent" | "failed" | "skipped";

export type PublicBookingNotificationChannel = {
  status: PublicBookingNotificationStatus;
  error?: string;
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
    clientPackage?: {
      id: number;
      code: string;
      packageTitle: string;
      remainingSessions: number;
    };
  };
  alreadyExistedClient: boolean;
  notifications?: {
    telegram: PublicBookingNotificationChannel;
    ownerEmail: PublicBookingNotificationChannel;
    clientEmail: PublicBookingNotificationChannel;
  };
};

export type PublicBookingCreateErrorResponse = {
  error: string;
  code?:
    | "invalid_payload"
    | "invalid_service"
    | "invalid_slot"
    | "slot_unavailable"
    | "settings_missing"
    | "invalid_package"
    | "package_unavailable"
    | "booking_create_failed";
};