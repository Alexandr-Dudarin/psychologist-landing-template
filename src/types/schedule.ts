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

export type AdminScheduleRecord = {
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
};

export type UpdateAdminSchedulePayload = {
  settings: BookingSettingsRecord;
  rules: ScheduleRuleRecord[];
};