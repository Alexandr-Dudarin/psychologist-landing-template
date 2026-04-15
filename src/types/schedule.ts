export type BookingSettingsRecord = {
  minAdvanceHours: number;
  bufferMinutes: number;
  allowSameDayBooking: boolean;
  maxDaysAhead: number;
};

export type ScheduleRuleRecord = {
  weekday: number;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
};

export type ScheduleOverrideRecord = {
  date: string;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string;
};

export type BlockedSlotRecord = {
  id: number;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
};

export type AdminScheduleRecord = {
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
  overrides: ScheduleOverrideRecord[];
  blockedSlots: BlockedSlotRecord[];
};

export type UpdateAdminSchedulePayload = {
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
};

export type CreateScheduleOverridePayload = {
  date: string;
  isWorkingDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  note?: string;
};

export type CreateBlockedSlotPayload = {
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
};