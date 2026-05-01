import type { PoolClient } from "pg";
import { validateBookableSlot } from "../publicBooking/bookingAvailability.js";
import type { SendBookingNotificationsPayload } from "../publicBooking/sendBookingNotifications.js";
import type {
  PublicBookingCreatePayload,
  PublicBookingCreateSuccessResponse,
} from "../../src/types/booking.js";

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
  const existingClient = await findExistingClientByContacts(
    db,
    payload.phone,
    payload.email
  );

  if (existingClient) {
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
        source,
        status,
        first_request_id
      )
      VALUES ($1, $2, $3, 'website', 'active', NULL)
      RETURNING id
    `,
    [payload.name, payload.phone, payload.email]
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
  const created = await db.query<RequestRow>(
    `
      INSERT INTO requests (
        name,
        phone,
        email,
        message,
        status,
        source,
        client_id
      )
      VALUES ($1, $2, $3, $4, 'booked', 'website', $5)
      RETURNING id
    `,
    [payload.name, payload.phone, payload.email, payload.message, clientId]
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

export async function createBookingService(
  client: PoolClient,
  payload: PublicBookingCreatePayload
): Promise<CreateBookingServiceResult> {
  await lockBookingDate(client, payload.startsAt);

  const slotValidation = await validateBookableSlot({
    serviceId: payload.serviceId,
    startsAt: payload.startsAt,
    db: client,
  });

  if (!slotValidation.ok) {
    throw mapSlotError(slotValidation.reason);
  }

  const normalizedPayload: NormalizedPayload = {
    ...payload,
    name: buildFullName(payload.firstName, payload.lastName),
  };

  const clientResult = await ensureClient(client, normalizedPayload);

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
        source
      )
      VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, 'website')
      RETURNING id
    `,
    [
      clientResult.clientId,
      slotValidation.service.id,
      slotValidation.slot.startsAt,
      slotValidation.service.durationMinutes,
      slotValidation.service.price,
      normalizedPayload.message,
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
    },
    alreadyExistedClient: clientResult.alreadyExisted,
  };

  const notificationPayload: SendBookingNotificationsPayload = {
    sessionId: response.booking.sessionId,
    clientName: normalizedPayload.name,
    clientPhone: normalizedPayload.phone,
    clientEmail: normalizedPayload.email,
    serviceTitle: response.booking.serviceTitle,
    startsAt: response.booking.startsAt,
    endsAt: response.booking.endsAt,
    comment: normalizedPayload.message ?? "",
    alreadyExistedClient: response.alreadyExistedClient,
  };

  return {
    response,
    notificationPayload,
  };
}