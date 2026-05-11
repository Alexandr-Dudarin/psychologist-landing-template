import type {
  CreateBlockedSlotPayload,
  CreateScheduleOverridePayload,
  UpdateAdminSchedulePayload,
} from "../../../types/schedule";

import { isBookingTimezone } from "../../../lib/booking/bookingTimezones";
import { weekdayLabels } from "./schedulePage.shared";
import { isPastOverrideDate } from "./schedulePageHelpers";

export function validateScheduleSettingsPayload(
  payload: UpdateAdminSchedulePayload
): string | null {
  if (
    !Number.isInteger(payload.settings.minAdvanceHours) ||
    payload.settings.minAdvanceHours < 0
  ) {
    return "Минимальное время до записи должно быть целым числом 0 или больше.";
  }

  if (
    !Number.isInteger(payload.settings.bufferMinutes) ||
    payload.settings.bufferMinutes < 0
  ) {
    return "Буфер между сессиями должен быть целым числом 0 или больше.";
  }

  if (
    !Number.isInteger(payload.settings.maxDaysAhead) ||
    payload.settings.maxDaysAhead <= 0
  ) {
    return "Глубина записи вперёд должна быть больше 0.";
  }

  if (!isBookingTimezone(payload.settings.timezone)) {
    return "Выберите корректный часовой пояс для онлайн-записи.";
  }

  for (const rule of payload.rules) {
    if (rule.isEnabled && rule.startTime >= rule.endTime) {
      return `Для "${weekdayLabels[rule.weekday]}" время начала должно быть раньше времени окончания.`;
    }
  }

  return null;
}

export function validateSettingsFormRequiredFields(
  settingsForm: {
    minAdvanceHours: string;
    bufferMinutes: string;
    maxDaysAhead: string;
    timezone: string;
  }
): string | null {
  if (settingsForm.minAdvanceHours.trim() === "") {
    return "Укажите минимум часов до записи.";
  }

  if (settingsForm.bufferMinutes.trim() === "") {
    return "Укажите буфер между сессиями.";
  }

  if (settingsForm.maxDaysAhead.trim() === "") {
    return "Укажите глубину записи вперёд.";
  }

  if (settingsForm.timezone.trim() === "") {
    return "Выберите часовой пояс записи.";
  }

  return null;
}

export function validateOverridePayload(
  payload: CreateScheduleOverridePayload,
  isEditing: boolean
): string | null {
  if (!payload.date) {
    return "Укажите дату исключения.";
  }

  if (isPastOverrideDate(payload.date)) {
    return isEditing
      ? "Нельзя перенести исключение на прошедшую дату."
      : "Нельзя создать исключение для прошедшей даты.";
  }

  if (
    payload.isWorkingDay &&
    (!payload.startTime || !payload.endTime || payload.startTime >= payload.endTime)
  ) {
    return "Для рабочего дня укажите корректное время начала и окончания.";
  }

  return null;
}

export function validateBlockedSlotPayload(
  payload: CreateBlockedSlotPayload
): string | null {
  if (!payload.blockedDate) {
    return "Укажите дату блокировки.";
  }

  if (
    !payload.startTime ||
    !payload.endTime ||
    payload.startTime >= payload.endTime
  ) {
    return "Укажите корректный временной диапазон блокировки.";
  }

  return null;
}

export function getMissingOverrideMessage(): string {
  return "Исключение по дате не найдено.";
}

export function getMissingBlockedSlotMessage(): string {
  return "Блокировка слота не найдена.";
}

export function getScheduleLoadErrorMessage(): string {
  return "Не удалось загрузить расписание";
}

export function getScheduleSaveSuccessMessage(): string {
  return "Расписание сохранено.";
}

export function getScheduleSaveErrorMessage(): string {
  return "Не удалось сохранить расписание";
}

export function getOverrideUpdatedMessage(): string {
  return "Исключение по дате обновлено.";
}

export function getOverrideCreatedMessage(): string {
  return "Исключение по дате сохранено.";
}

export function getOverrideUpdateErrorMessage(): string {
  return "Не удалось обновить исключение по дате";
}

export function getOverrideCreateErrorMessage(): string {
  return "Не удалось сохранить исключение по дате";
}

export function getOverrideDeleteConfirmMessage(): string {
  return "Удалить исключение по этой дате? Это действие нельзя отменить.";
}

export function getOverrideDeletedMessage(): string {
  return "Исключение по дате удалено.";
}

export function getOverrideDeleteErrorMessage(): string {
  return "Не удалось удалить исключение по дате";
}

export function getBlockedSlotUpdatedMessage(): string {
  return "Блокировка обновлена.";
}

export function getBlockedSlotCreatedMessage(): string {
  return "Блокировка слота создана.";
}

export function getBlockedSlotUpdateErrorMessage(): string {
  return "Не удалось обновить блокировку слота";
}

export function getBlockedSlotCreateErrorMessage(): string {
  return "Не удалось создать блокировку слота";
}

export function getBlockedSlotDeleteConfirmMessage(): string {
  return "Удалить блокировку этого слота? Это действие нельзя отменить.";
}

export function getBlockedSlotDeletedMessage(): string {
  return "Блокировка удалена.";
}

export function getBlockedSlotDeleteErrorMessage(): string {
  return "Не удалось удалить блокировку";
}
