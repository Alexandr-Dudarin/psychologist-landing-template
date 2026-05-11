import { dateTimeLocalInTimeZoneToIso, toDateTimeLocalValueInTimeZone } from "../../../lib/datetime/practiceTimezone";
import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  UpdateSessionPayload,
} from "../../../types/session";
import type { SessionForm } from "./sessionForm";

export function updateSessionFormField(
  form: SessionForm,
  field: keyof SessionForm,
  value: string,
  services: CrmServiceRecord[]
): SessionForm {
  if (field !== "serviceId") {
    return {
      ...form,
      [field]: value,
    };
  }

  const selectedService = services.find((service) => service.id === Number(value));

  return {
    ...form,
    serviceId: value,
    durationMinutes: selectedService
      ? String(selectedService.durationMinutes)
      : form.durationMinutes,
    price: selectedService ? String(selectedService.price) : form.price,
  };
}

export function buildCreateSessionPayload(
  form: SessionForm,
  timezone: string
): CreateSessionPayload {
  return {
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    scheduledAt: dateTimeLocalInTimeZoneToIso(form.scheduledAt, timezone) ?? "",
    durationMinutes: Number(form.durationMinutes),
    price: Number(form.price),
    status: form.status,
    notes: form.notes.trim(),
    source: "manual",
  };
}

export function buildUpdateSessionPayload(
  sessionId: number,
  form: SessionForm,
  timezone: string
): UpdateSessionPayload {
  return {
    id: sessionId,
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    scheduledAt: dateTimeLocalInTimeZoneToIso(form.scheduledAt, timezone) ?? "",
    durationMinutes: Number(form.durationMinutes),
    price: Number(form.price),
    status: form.status,
    notes: form.notes.trim(),
  };
}

export function buildEditSessionForm(
  session: CrmSessionRecord,
  timezone: string
): SessionForm {
  return {
    clientId: String(session.clientId),
    serviceId: String(session.serviceId),
    scheduledAt: toDateTimeLocalValueInTimeZone(session.scheduledAt, timezone),
    durationMinutes: String(session.durationMinutes),
    price: String(session.price),
    status: session.status,
    notes: session.notes,
  };
}
