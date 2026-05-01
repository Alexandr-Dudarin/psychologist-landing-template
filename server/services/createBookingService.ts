import type { PoolClient } from "pg";
import { validateBookableSlot } from "../publicBooking/bookingAvailability";
import { sendBookingNotificationsBounded } from "../publicBooking/sendBookingNotifications";
import type {
  PublicBookingCreatePayload,
  PublicBookingCreateSuccessResponse,
} from "../../src/types/booking";

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
      INSERT INTO clients (name, phone, email, source, status)
      VALUES ($1, $2, $3, 'website', 'active')
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
      INSERT INTO requests (name, phone, email, message, status, source, client_id)
      VALUES ($1, $2, $3, $4, 'booked', 'website', $5)
      RETURNING id
    `,
    [payload.name, payload.phone, payload.email, payload.message, clientId]
  );

  return Number(created.rows[0].id);
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
): Promise<PublicBookingCreateSuccessResponse> {

  await lockBookingDate(client, payload.startsAt);

  const slotValidation = await validateBookableSlot({
    serviceId: payload.serviceId,
    startsAt: payload.startsAt,
    db: client,
  });

  if (!slotValidation.ok) {
    throw new Error("Slot not available");
  }

  const normalizedPayload: NormalizedPayload = {
    ...payload,
    name: buildFullName(payload.firstName, payload.lastName),
  };

  const clientResult = await ensureClient(client, normalizedPayload);

  await createBookedRequest(
    client,
    normalizedPayload,
    clientResult.clientId
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

  void sendBookingNotificationsBounded({
    sessionId: response.booking.sessionId,
    clientName: normalizedPayload.name,
    clientPhone: normalizedPayload.phone,
    clientEmail: normalizedPayload.email,
    serviceTitle: response.booking.serviceTitle,
    startsAt: response.booking.startsAt,
    endsAt: response.booking.endsAt,
    comment: normalizedPayload.message ?? "",
    alreadyExistedClient: response.alreadyExistedClient,
  }).catch((error) => {
    console.error("Async booking notifications failed:", {
      sessionId: response.booking.sessionId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  });

  return response;
}