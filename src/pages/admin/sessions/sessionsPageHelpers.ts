import {
  dateTimeLocalInTimeZoneToIso,
  toDateTimeLocalValueInTimeZone,
} from "../../../lib/datetime/practiceTimezone";
import type { CrmClientServicePackageRecord } from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import type {
  CrmSessionRecord,
  CreateSessionPayload,
  UpdateSessionPayload,
} from "../../../types/session";
import type { SessionForm } from "./sessionForm";

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
    const selectedService = services.find(
      (service) => service.id === Number(value)
    );
    const selectedPackage = findSelectedPackage(
      clientPackages,
      form.clientPackageId
    );
    const shouldKeepPackage =
      selectedPackage !== null && selectedPackage.serviceId === Number(value);

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
    price: Number(form.price),
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
    price: Number(form.price),
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