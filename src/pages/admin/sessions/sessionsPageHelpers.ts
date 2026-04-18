import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  UpdateSessionPayload,
} from "../../../types/session";

import { toDateTimeLocalValue, type SessionForm } from "./sessionForm";

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
  form: SessionForm
): CreateSessionPayload {
  return {
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    scheduledAt: form.scheduledAt,
    durationMinutes: Number(form.durationMinutes),
    price: Number(form.price),
    status: form.status,
    notes: form.notes.trim(),
    source: "manual",
  };
}

export function buildUpdateSessionPayload(
  sessionId: number,
  form: SessionForm
): UpdateSessionPayload {
  return {
    id: sessionId,
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    scheduledAt: form.scheduledAt,
    durationMinutes: Number(form.durationMinutes),
    price: Number(form.price),
    status: form.status,
    notes: form.notes.trim(),
  };
}

export function buildEditSessionForm(session: CrmSessionRecord): SessionForm {
  return {
    clientId: String(session.clientId),
    serviceId: String(session.serviceId),
    scheduledAt: toDateTimeLocalValue(session.scheduledAt),
    durationMinutes: String(session.durationMinutes),
    price: String(session.price),
    status: session.status,
    notes: session.notes,
  };
}
