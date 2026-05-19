import type { PoolClient } from "pg";
import { validateBookableSlot } from "../publicBooking/bookingAvailability.js";
import type { SendBookingNotificationsPayload } from "../publicBooking/sendBookingNotifications.js";
import type {
  PublicBookingCreatePayload,
  PublicBookingCreateSuccessResponse,
} from "../../src/types/booking.js";
import {
  formatPreferredContactDisplay,
  normalizePreferredContactForStorage,
} from "../../src/lib/preferredContact.js";

type NormalizedPayload = PublicBookingCreatePayload & {
  name: string;
};

type ClientRow = {
  id: number | string;
};

type SessionRow = {
  id: number | string;
};

type RequestRow = {
  id: number | string;
};

type ClientPackageRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  code: string;
  package_title: string;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  sessions_count: number | string;
  status: string;
  used_sessions_count: number | string;
};

type ResolvedClientPackage = {
  id: number;
  clientId: number;
  clientName: string;
  code: string;
  packageTitle: string;
  serviceId: number;
  serviceTitle: string;
  serviceDurationMinutes: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
};

type SlotValidationErrorReason =
  | "invalid_service"
  | "invalid_date"
  | "invalid_slot"
  | "settings_missing"
  | "outside_booking_window"
  | "slot_unavailable";

export type CreateBookingServiceResult = {
  response: PublicBookingCreateSuccessResponse;
  notificationPayload: SendBookingNotificationsPayload;
};

export class CreateBookingServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CreateBookingServiceError";
    this.status = status;
    this.code = code;
  }
}

export function isCreateBookingServiceError(
  error: unknown
): error is CreateBookingServiceError {
  return error instanceof CreateBookingServiceError;
}

function isSlotValidationError(
  result: Awaited<ReturnType<typeof validateBookableSlot>>
): result is Extract<Awaited<ReturnType<typeof validateBookableSlot>>, { ok: false }> {
  return result.ok === false;
}

function mapSlotError(reason: SlotValidationErrorReason): CreateBookingServiceError {
  if (reason === "invalid_service") {
    return new CreateBookingServiceError(
      400,
      "invalid_service",
      "Услуга недоступна для онлайн-записи."
    );
  }

  if (reason === "invalid_date" || reason === "invalid_slot") {
    return new CreateBookingServiceError(
      400,
      "invalid_slot",
      "Некорректный слот для записи."
    );
  }

  if (reason === "outside_booking_window") {
    return new CreateBookingServiceError(
      409,
      "slot_unavailable",
      "Этот слот уже вне окна онлайн-записи. Пожалуйста, выберите другой."
    );
  }

  if (reason === "settings_missing") {
    return new CreateBookingServiceError(
      500,
      "settings_missing",
      "Не удалось загрузить настройки записи."
    );
  }

  return new CreateBookingServiceError(
    409,
    "slot_unavailable",
    "Выбранный слот уже недоступен. Пожалуйста, выберите другой."
  );
}

function normalizeNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function buildFullName(firstName: string, lastName: string): string {
  return [normalizeNamePart(firstName), normalizeNamePart(lastName)]
    .filter(Boolean)
    .join(" ");
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePackageCode(value: string): string {
  return value.trim().toUpperCase();
}

function mapClientPackage(row: ClientPackageRow): ResolvedClientPackage {
  const totalSessions = Number(row.sessions_count);
  const usedSessions = Number(row.used_sessions_count);
  const remainingSessions = Math.max(totalSessions - usedSessions, 0);

  return {
    id: Number(row.id),
    clientId: Number(row.client_id),
    clientName: row.client_name,
    code: row.code,
    packageTitle: row.package_title,
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    serviceDurationMinutes: Number(row.service_duration_minutes),
    totalSessions,
    usedSessions,
    remainingSessions,
  };
}

async function findExistingClientByContacts(
  db: Pick<PoolClient, "query">,
  phone: string,
  email: string
): Promise<ClientRow | null> {
  const normalizedPhone = normalizePhoneDigits(phone);
  const normalizedEmail = email.trim().toLowerCase();

  const result = await db.query<ClientRow>(
    `
      SELECT id
      FROM clients
      WHERE
        regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
        OR LOWER(COALESCE(email, '')) = $2
      LIMIT 1
    `,
    [normalizedPhone, normalizedEmail]
  );

  return result.rows[0] ?? null;
}

async function ensureClient(
  db: Pick<PoolClient, "query">,
  payload: NormalizedPayload
) {
  const preferredContact = normalizePreferredContactForStorage({
    preferredContactMethod: payload.preferredContactMethod ?? "",
    preferredContactValue: payload.preferredContactValue ?? "",
  });
  const existingClient = await findExistingClientByContacts(
    db,
    payload.phone,
    payload.email
  );

  if (existingClient) {
    if (
      preferredContact.preferredContactMethod &&
      preferredContact.preferredContactValue
    ) {
      await db.query(
        `
          UPDATE clients
          SET
            preferred_contact_method = $2,
            preferred_contact_value = $3
          WHERE id = $1
        `,
        [
          existingClient.id,
          preferredContact.preferredContactMethod,
          preferredContact.preferredContactValue,
        ]
      );
    }

    return {
      clientId: Number(existingClient.id),
      alreadyExisted: true,
    };
  }

  const created = await db.query<ClientRow>(
    `
      INSERT INTO clients (
        name,
        phone,
        email,
        preferred_contact_method,
        preferred_contact_value,
        source,
        status,
        first_request_id
      )
      VALUES ($1, $2, $3, $4, $5, 'website', 'active', NULL)
      RETURNING id
    `,
    [
      payload.name,
      payload.phone,
      payload.email,
      preferredContact.preferredContactMethod,
      preferredContact.preferredContactValue,
    ]
  );

  return {
    clientId: Number(created.rows[0].id),
    alreadyExisted: false,
  };
}

async function createBookedRequest(
  db: Pick<PoolClient, "query">,
  payload: NormalizedPayload,
  clientId: number
) {
  const preferredContact = normalizePreferredContactForStorage({
    preferredContactMethod: payload.preferredContactMethod ?? "",
    preferredContactValue: payload.preferredContactValue ?? "",
  });

  const created = await db.query<RequestRow>(
    `
      INSERT INTO requests (
        name,
        phone,
        email,
        message,
        preferred_contact_method,
        preferred_contact_value,
        status,
        source,
        client_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'booked', 'website', $7)
      RETURNING id
    `,
    [
      payload.name,
      payload.phone,
      payload.email,
      payload.message,
      preferredContact.preferredContactMethod,
      preferredContact.preferredContactValue,
      clientId,
    ]
  );

  return Number(created.rows[0].id);
}

async function setClientFirstRequestIfMissing(
  db: Pick<PoolClient, "query">,
  clientId: number,
  requestId: number
) {
  await db.query(
    `
      UPDATE clients
      SET first_request_id = $2
      WHERE id = $1
        AND first_request_id IS NULL
    `,
    [clientId, requestId]
  );
}

async function lockBookingDate(db: Pick<PoolClient, "query">, startsAt: string) {
  const bookingDateKey = startsAt.slice(0, 10);

  await db.query(
    `
      SELECT pg_advisory_xact_lock(
        ('x' || substr(md5($1), 1, 16))::bit(64)::bigint
      )
    `,
    [`public-booking-date:${bookingDateKey}`]
  );
}

async function findClientPackageByCodeAndContacts(
  db: Pick<PoolClient, "query">,
  params: {
    code: string;
    phone: string;
    email: string;
    contact: string;
  }
): Promise<ResolvedClientPackage | null> {
  const normalizedCode = normalizePackageCode(params.code);
  const normalizedPhone = normalizePhoneDigits(params.phone || params.contact);
  const normalizedEmail = (params.email || params.contact).trim().toLowerCase();

  const result = await db.query<ClientPackageRow>(
    `
      SELECT
        csp.id,
        csp.client_id,
        c.name AS client_name,
        csp.code,
        spp.title AS package_title,
        spp.service_id,
        sv.title AS service_title,
        sv.duration_minutes AS service_duration_minutes,
        spp.sessions_count,
        csp.status,
        (
          SELECT COUNT(*)
          FROM sessions s
          WHERE s.client_package_id = csp.id
            AND s.status IN ('scheduled', 'completed', 'no_show')
        ) AS used_sessions_count
      FROM client_service_packages csp
      INNER JOIN clients c ON c.id = csp.client_id
      INNER JOIN service_package_plans spp ON spp.id = csp.package_plan_id
      INNER JOIN services sv ON sv.id = spp.service_id
      WHERE UPPER(csp.code) = $1
        AND csp.status = 'active'
        AND c.status = 'active'
        AND sv.is_active = TRUE
        AND (
          regexp_replace(COALESCE(c.phone, ''), '[^0-9]', '', 'g') = $2
          OR LOWER(COALESCE(c.email, '')) = $3
        )
      LIMIT 1
    `,
    [normalizedCode, normalizedPhone, normalizedEmail]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return mapClientPackage(row);
}

async function resolveClientPackageForBooking(
  db: Pick<PoolClient, "query">,
  payload: PublicBookingCreatePayload
): Promise<ResolvedClientPackage | null> {
  const packageCode = payload.clientPackageCode?.trim();

  if (!packageCode) {
    return null;
  }

  const packageContact =
    payload.clientPackageContact?.trim() || payload.email.trim() || payload.phone.trim();

  const clientPackage = await findClientPackageByCodeAndContacts(db, {
    code: packageCode,
    phone: payload.phone,
    email: payload.email,
    contact: packageContact,
  });

  if (!clientPackage) {
    throw new CreateBookingServiceError(
      404,
      "invalid_package",
      "Пакет не найден. Проверьте код и телефон/email."
    );
  }

  if (clientPackage.remainingSessions <= 0) {
    throw new CreateBookingServiceError(
      409,
      "package_unavailable",
      "В этом пакете не осталось доступных сессий."
    );
  }

  if (payload.serviceId !== clientPackage.serviceId) {
    throw new CreateBookingServiceError(
      400,
      "invalid_package",
      "Выбранная услуга не совпадает с услугой из пакета."
    );
  }

  return clientPackage;
}

export async function createBookingService(
  client: PoolClient,
  payload: PublicBookingCreatePayload
): Promise<CreateBookingServiceResult> {
  await lockBookingDate(client, payload.startsAt);

  const clientPackage = await resolveClientPackageForBooking(client, payload);
  const serviceIdForSlot = clientPackage?.serviceId ?? payload.serviceId;

  const slotValidation = await validateBookableSlot({
    serviceId: serviceIdForSlot,
    startsAt: payload.startsAt,
    db: client,
  });

  if (isSlotValidationError(slotValidation)) {
    throw mapSlotError(slotValidation.reason);
  }

  const normalizedPayload: NormalizedPayload = {
    ...payload,
    name: buildFullName(payload.firstName, payload.lastName),
  };

  const clientResult = await ensureClient(client, normalizedPayload);

  if (clientPackage && clientResult.clientId !== clientPackage.clientId) {
    throw new CreateBookingServiceError(
      400,
      "invalid_package",
      "Пакет принадлежит другому клиенту. Проверьте телефон и email."
    );
  }

  const createdRequestId = await createBookedRequest(
    client,
    normalizedPayload,
    clientResult.clientId
  );

  await setClientFirstRequestIfMissing(
    client,
    clientResult.clientId,
    createdRequestId
  );

  const sessionInsert = await client.query<SessionRow>(
    `
      INSERT INTO sessions (
        client_id,
        service_id,
        scheduled_at,
        duration_minutes,
        price,
        status,
        notes,
        source,
        client_package_id
      )
      VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, 'website', $7)
      RETURNING id
    `,
    [
      clientResult.clientId,
      slotValidation.service.id,
      slotValidation.slot.startsAt,
      slotValidation.service.durationMinutes,
      clientPackage ? 0 : slotValidation.service.price,
      normalizedPayload.message,
      clientPackage?.id ?? null,
    ]
  );

  const response: PublicBookingCreateSuccessResponse = {
    success: true,
    booking: {
      sessionId: Number(sessionInsert.rows[0].id),
      clientId: clientResult.clientId,
      serviceId: slotValidation.service.id,
      serviceTitle: slotValidation.service.title,
      startsAt: slotValidation.slot.startsAt,
      endsAt: slotValidation.slot.endsAt,
      clientPackage: clientPackage
        ? {
            id: clientPackage.id,
            code: clientPackage.code,
            packageTitle: clientPackage.packageTitle,
            remainingSessions: Math.max(clientPackage.remainingSessions - 1, 0),
          }
        : undefined,
    },
    alreadyExistedClient: clientResult.alreadyExisted,
  };

  const notificationPayload: SendBookingNotificationsPayload = {
    sessionId: response.booking.sessionId,
    clientName: normalizedPayload.name,
    clientPhone: normalizedPayload.phone,
    clientEmail: normalizedPayload.email,
    preferredContact: formatPreferredContactDisplay(
      normalizedPayload.preferredContactMethod,
      normalizedPayload.preferredContactValue,
      "-"
    ),
    serviceTitle: response.booking.serviceTitle,
    startsAt: response.booking.startsAt,
    endsAt: response.booking.endsAt,
    timezone: slotValidation.timezone,
    comment: normalizedPayload.message ?? "",
    alreadyExistedClient: response.alreadyExistedClient,
  };

  return {
    response,
    notificationPayload,
  };
}