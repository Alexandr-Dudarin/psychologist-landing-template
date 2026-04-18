import type {
  BlockedSlotRecord,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
  UpdateAdminSchedulePayload,
} from "../../../types/schedule";

import {
  defaultSettingsForm,
  initialBlockedSlotForm,
  initialOverrideForm,
  mapBlockedSlotToForm,
  mapOverrideToForm,
  normalizeDateOnly,
  type BlockedSlotForm,
  type OverrideForm,
  type SettingsForm,
} from "./schedulePage.shared";

type AdminScheduleData = Awaited<
  ReturnType<typeof import("../../../lib/api/adminSchedule").getAdminSchedule>
>;

export type BuiltOverridePayload = {
  date: string;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string;
};

export type BuiltBlockedSlotPayload = {
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isPastOverrideDate(date: string): boolean {
  const normalizedDate = normalizeDateOnly(date);

  if (!normalizedDate) {
    return false;
  }

  return normalizedDate < getTodayLocalDateString();
}

export function mapScheduleDataToSettingsForm(
  data: AdminScheduleData
): SettingsForm {
  return {
    minAdvanceHours: String(data.settings.minAdvanceHours),
    bufferMinutes: String(data.settings.bufferMinutes),
    allowSameDayBooking: data.settings.allowSameDayBooking,
    maxDaysAhead: String(data.settings.maxDaysAhead),
  };
}

export function buildUpdateSchedulePayload(
  settingsForm: SettingsForm,
  rules: ScheduleRuleRecord[]
): UpdateAdminSchedulePayload {
  return {
    settings: {
      minAdvanceHours: Number(settingsForm.minAdvanceHours),
      bufferMinutes: Number(settingsForm.bufferMinutes),
      allowSameDayBooking: settingsForm.allowSameDayBooking,
      maxDaysAhead: Number(settingsForm.maxDaysAhead),
    },
    rules,
  };
}

export function buildOverridePayload(
  overrideForm: OverrideForm
): BuiltOverridePayload {
  return {
    date: normalizeDateOnly(overrideForm.date),
    isWorkingDay: overrideForm.isWorkingDay,
    startTime: overrideForm.isWorkingDay
      ? overrideForm.startTime ?? null
      : null,
    endTime: overrideForm.isWorkingDay
      ? overrideForm.endTime ?? null
      : null,
    note: overrideForm.note?.trim() ?? "",
  };
}

export function buildBlockedSlotPayload(
  blockedSlotForm: BlockedSlotForm
): BuiltBlockedSlotPayload {
  return {
    blockedDate: normalizeDateOnly(blockedSlotForm.blockedDate),
    startTime: blockedSlotForm.startTime ?? "",
    endTime: blockedSlotForm.endTime ?? "",
    reason: blockedSlotForm.reason?.trim() ?? "",
  };
}

export function updateSettingsTextField(
  settingsForm: SettingsForm,
  field: "minAdvanceHours" | "bufferMinutes" | "maxDaysAhead",
  value: string
): SettingsForm {
  return {
    ...settingsForm,
    [field]: value,
  };
}

export function updateSettingsCheckboxField(
  settingsForm: SettingsForm,
  value: boolean
): SettingsForm {
  return {
    ...settingsForm,
    allowSameDayBooking: value,
  };
}

export function updateRuleField(
  rules: ScheduleRuleRecord[],
  weekday: number,
  field: keyof ScheduleRuleRecord,
  value: string | boolean
): ScheduleRuleRecord[] {
  return rules.map((rule) =>
    rule.weekday === weekday ? { ...rule, [field]: value } : rule
  );
}

export function updateOverrideFormField(
  form: OverrideForm,
  field: keyof OverrideForm,
  value: string | boolean
): OverrideForm {
  return {
    ...form,
    [field]: value,
  };
}

export function updateBlockedSlotFormField(
  form: BlockedSlotForm,
  field: keyof BlockedSlotForm,
  value: string
): BlockedSlotForm {
  return {
    ...form,
    [field]: value,
  };
}

export function findOverrideByDate(
  overrides: ScheduleOverrideRecord[],
  date: string
): ScheduleOverrideRecord | undefined {
  return overrides.find(
    (override) => normalizeDateOnly(override.date) === normalizeDateOnly(date)
  );
}

export function findBlockedSlotById(
  blockedSlots: BlockedSlotRecord[],
  id: number
): BlockedSlotRecord | undefined {
  return blockedSlots.find((slot) => slot.id === id);
}

export function buildOverrideEditState(item: ScheduleOverrideRecord) {
  return {
    editingOverrideDate: normalizeDateOnly(item.date),
    form: mapOverrideToForm(item),
  };
}

export function normalizeScheduleDate(value: string): string {
  return normalizeDateOnly(value);
}

export function buildBlockedSlotEditState(item: BlockedSlotRecord) {
  return {
    editingBlockedSlotId: item.id,
    form: mapBlockedSlotToForm(item),
  };
}

export function getInitialOverrideForm(): OverrideForm {
  return initialOverrideForm;
}

export function getInitialBlockedSlotForm(): BlockedSlotForm {
  return initialBlockedSlotForm;
}

export function getDefaultSettingsForm(): SettingsForm {
  return defaultSettingsForm;
}