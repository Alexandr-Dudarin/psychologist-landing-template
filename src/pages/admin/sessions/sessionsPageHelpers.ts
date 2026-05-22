import {
  dateTimeLocalInTimeZoneToIso,
  toDateTimeLocalValueInTimeZone,
} from "../../../lib/datetime/practiceTimezone";
import { normalizeAdminPriceInput } from "../../../lib/format/adminPriceInput";
import type { AdminScheduleRecord } from "../../../types/schedule";
import type {
  ClientFavoriteFilter,
  CrmClientServicePackageRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  SessionStatus,
  UpdateSessionPayload,
} from "../../../types/session";
import type { SessionForm } from "./sessionForm";

type TimeRangeMinutes = {
  start: number;
  end: number;
};

function findSelectedPackage(
  clientPackages: CrmClientServicePackageRecord[],
  value: string
): CrmClientServicePackageRecord | null {
  const packageId = Number(value);

  if (!Number.isInteger(packageId) || packageId <= 0) {
    return null;
  }

  return clientPackages.find((item) => item.id === packageId) ?? null;
}

function findSelectedService(
  services: CrmServiceRecord[],
  value: string
): CrmServiceRecord | null {
  const serviceId = Number(value);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  return services.find((service) => Number(service.id) === serviceId) ?? null;
}

function getNormalizedPriceNumber(value: string): number {
  const normalizedValue = normalizeAdminPriceInput(value);

  return Number(normalizedValue || 0);
}

export function updateSessionFormField(
  form: SessionForm,
  field: keyof SessionForm,
  value: string,
  services: CrmServiceRecord[],
  clientPackages: CrmClientServicePackageRecord[] = []
): SessionForm {
  if (field === "clientId") {
    return {
      ...form,
      clientId: value,
      clientPackageId: "",
    };
  }

  if (field === "clientPackageId") {
    const selectedPackage = findSelectedPackage(clientPackages, value);

    if (!selectedPackage) {
      return {
        ...form,
        clientPackageId: "",
      };
    }

    return {
      ...form,
      clientPackageId: value,
      serviceId: String(selectedPackage.serviceId),
      durationMinutes: String(selectedPackage.serviceDurationMinutes),
      price: "0",
    };
  }

  if (field === "serviceId") {
    const selectedService = findSelectedService(services, value);
    const selectedPackage = findSelectedPackage(
      clientPackages,
      form.clientPackageId
    );
    const shouldKeepPackage =
      selectedPackage !== null &&
      Number(selectedPackage.serviceId) === Number(value);

    return {
      ...form,
      serviceId: value,
      clientPackageId: shouldKeepPackage ? form.clientPackageId : "",
      durationMinutes: selectedService
        ? String(selectedService.durationMinutes)
        : form.durationMinutes,
      price:
        shouldKeepPackage && selectedPackage
          ? "0"
          : selectedService
            ? String(selectedService.price)
            : form.price,
    };
  }

  if (field === "price") {
    return {
      ...form,
      price: normalizeAdminPriceInput(value),
    };
  }

  return {
    ...form,
    [field]: value,
  };
}

export function buildCreateSessionPayload(
  form: SessionForm,
  timezone: string
): CreateSessionPayload {
  const clientPackageId = Number(form.clientPackageId);

  return {
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    scheduledAt: dateTimeLocalInTimeZoneToIso(form.scheduledAt, timezone) ?? "",
    durationMinutes: Number(form.durationMinutes),
    price: getNormalizedPriceNumber(form.price),
    status: form.status,
    notes: form.notes.trim(),
    source: "manual",
    clientPackageId:
      Number.isInteger(clientPackageId) && clientPackageId > 0
        ? clientPackageId
        : null,
  };
}

export function buildUpdateSessionPayload(
  sessionId: number,
  form: SessionForm,
  timezone: string
): UpdateSessionPayload {
  const clientPackageId = Number(form.clientPackageId);

  return {
    id: sessionId,
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    scheduledAt: dateTimeLocalInTimeZoneToIso(form.scheduledAt, timezone) ?? "",
    durationMinutes: Number(form.durationMinutes),
    price: getNormalizedPriceNumber(form.price),
    status: form.status,
    notes: form.notes.trim(),
    clientPackageId:
      Number.isInteger(clientPackageId) && clientPackageId > 0
        ? clientPackageId
        : null,
  };
}

export function buildEditSessionForm(
  session: CrmSessionRecord,
  timezone: string
): SessionForm {
  return {
    clientId: String(session.clientId),
    serviceId: String(session.serviceId),
    clientPackageId: session.clientPackageId
      ? String(session.clientPackageId)
      : "",
    scheduledAt: toDateTimeLocalValueInTimeZone(session.scheduledAt, timezone),
    durationMinutes: String(session.durationMinutes),
    price: String(session.price),
    status: session.status,
    notes: session.notes,
  };
}

export function isArchivedStatus(status: SessionStatus | "all") {
  return status === "completed" || status === "cancelled" || status === "no_show";
}

export function getParsedClientId(value: string): number | null {
  const clientId = Number(value);

  return Number.isInteger(clientId) && clientId > 0 ? clientId : null;
}

function parseDateTimeLocalParts(
  value: string
): { dateKey: string; time: string } | null {
  if (!value.includes("T")) {
    return null;
  }

  const dateKey = value.slice(0, 10);
  const time = value.slice(11, 16);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  return { dateKey, time };
}

function getMinutesFromTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.slice(0, 5));

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getWeekdayFromDateKey(dateKey: string): number | null {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const weekday = date.getDay();

  return weekday === 0 ? 7 : weekday;
}

function rangesOverlap(first: TimeRangeMinutes, second: TimeRangeMinutes) {
  return first.start < second.end && second.start < first.end;
}

function getTimeRange(
  startTime: string,
  endTime: string
): TimeRangeMinutes | null {
  const start = getMinutesFromTime(startTime);
  const end = getMinutesFromTime(endTime);

  if (start === null || end === null || start >= end) {
    return null;
  }

  return { start, end };
}

function getScheduleWorkingRange(
  dateKey: string,
  rules: AdminScheduleRecord["rules"],
  overrides: AdminScheduleRecord["overrides"]
): TimeRangeMinutes | null {
  const override = overrides.find(
    (item) => item.date.slice(0, 10) === dateKey
  );

  if (override) {
    if (!override.isWorkingDay || !override.startTime || !override.endTime) {
      return null;
    }

    return getTimeRange(override.startTime, override.endTime);
  }

  const weekday = getWeekdayFromDateKey(dateKey);

  if (weekday === null) {
    return null;
  }

  const rule = rules.find((item) => item.weekday === weekday);

  if (!rule || !rule.isEnabled) {
    return null;
  }

  return getTimeRange(rule.startTime, rule.endTime);
}

function isNonWorkingDay(
  dateKey: string,
  rules: AdminScheduleRecord["rules"],
  overrides: AdminScheduleRecord["overrides"]
): boolean {
  const override = overrides.find(
    (item) => item.date.slice(0, 10) === dateKey
  );

  if (override) {
    return !override.isWorkingDay || !override.startTime || !override.endTime;
  }

  const weekday = getWeekdayFromDateKey(dateKey);

  if (weekday === null) {
    return false;
  }

  const rule = rules.find((item) => item.weekday === weekday);

  return !rule || !rule.isEnabled;
}

export function getManualSessionScheduleWarning(
  form: SessionForm,
  rules: AdminScheduleRecord["rules"],
  overrides: AdminScheduleRecord["overrides"],
  blockedSlots: AdminScheduleRecord["blockedSlots"]
): string | null {
  const dateTimeParts = parseDateTimeLocalParts(form.scheduledAt);

  if (!dateTimeParts) {
    return null;
  }

  const startMinutes = getMinutesFromTime(dateTimeParts.time);
  const durationMinutes = Number(form.durationMinutes);

  if (
    startMinutes === null ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return null;
  }

  const sessionRange = {
    start: startMinutes,
    end: startMinutes + durationMinutes,
  };
  const warnings: string[] = [];

  if (isNonWorkingDay(dateTimeParts.dateKey, rules, overrides)) {
    warnings.push(
      "Вы выбрали день, который сейчас отмечен в расписании как выходной. Сессию всё равно можно создать вручную, если это осознанное исключение."
    );
  } else {
    const workingRange = getScheduleWorkingRange(
      dateTimeParts.dateKey,
      rules,
      overrides
    );

    if (
      workingRange &&
      (sessionRange.start < workingRange.start || sessionRange.end > workingRange.end)
    ) {
      warnings.push(
        "Выбранное время выходит за рабочие часы в расписании. Сессию всё равно можно создать вручную, если это осознанное исключение."
      );
    }
  }

  const blockedSlot = blockedSlots.find((item) => {
    if (item.blockedDate.slice(0, 10) !== dateTimeParts.dateKey) {
      return false;
    }

    const blockedRange = getTimeRange(item.startTime, item.endTime);

    return blockedRange ? rangesOverlap(sessionRange, blockedRange) : false;
  });

  if (blockedSlot) {
    warnings.push(
      blockedSlot.reason
        ? `На это время есть блокировка записи: ${blockedSlot.reason}. Сессию всё равно можно создать вручную, если это осознанное исключение.`
        : "На это время есть блокировка записи. Сессию всё равно можно создать вручную, если это осознанное исключение."
    );
  }

  return warnings.length > 0 ? warnings.join(" ") : null;
}

export function filterSessionsByFavoriteClients(
  sessions: CrmSessionRecord[],
  favoriteClientIds: Set<number>,
  favoriteFilter: ClientFavoriteFilter
): CrmSessionRecord[] {
  if (favoriteFilter !== "favorites") {
    return sessions;
  }

  return sessions.filter((session) => favoriteClientIds.has(session.clientId));
}
