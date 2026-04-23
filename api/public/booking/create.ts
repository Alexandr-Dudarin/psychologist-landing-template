/// <reference types="node" />

import type { PoolClient } from "pg";
import { pool } from "../../../server/db/pool";
import { validateBookableSlot } from "../../../server/publicBooking/bookingAvailability";
import { sendBookingNotificationsBounded } from "../../../server/publicBooking/sendBookingNotifications";
import type {
  PublicBookingCreatePayload,
  PublicBookingCreateSuccessResponse,
} from "../../../src/types/booking";

type ParsedPayload = PublicBookingCreatePayload;

type ClientRow = {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  first_request_id: number | string | null;
  created_at: string;
};

type SessionRow = {
  id: number | string;
  scheduled_at: string;
};

type RequestRow = {
  id: number | string;
};

function parseBody(body: any): ParsedPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const serviceId = Number(rawBody?.serviceId);
  const startsAt =
    typeof rawBody?.startsAt === "string" ? rawBody.startsAt.trim() : "";
  const name = typeof rawBody?.name === "string" ? rawBody.name.trim() : "";
  const phone = typeof rawBody?.phone === "string" ? rawBody.phone.trim() : "";
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const message =
    typeof rawBody?.message === "string" ? rawBody.message.trim() : "";
  const consent = rawBody?.consent === true;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return null;
  }

  if (!startsAt || !name || !phone || !email || !consent) {
    return null;
  }

  return {
    serviceId,
    startsAt,
    name,
    phone,
    email,
    message,
    consent,
  };
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
  const conditions: string[] = [];
  const values: string[] = [];

  if (normalizedPhone) {
    values.push(normalizedPhone);
    conditions.push(
      `regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $${values.length}`
    );
  }

  if (normalizedEmail) {
    values.push(normalizedEmail);
    conditions.push(`LOWER(COALESCE(email, '')) = $${values.length}`);
  }

  if (conditions.length === 0) {
    return null;
  }

  const result = await db.query<ClientRow>(
    `
      SELECT
        id,
        name,
        phone,
        email,
        source,
        status,
        first_request_id,
        created_at
      FROM clients
      WHERE ${conditions.join(" OR ")}
      ORDER BY created_at ASC
      LIMIT 1
    `,
    values
  );

  return result.rows[0] ?? null;
}

async function ensureClient(
  db: Pick<PoolClient, "query">,
  payload: ParsedPayload
): Promise<{ clientId: number; alreadyExisted: boolean }> {
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
      RETURNING
        id,
        name,
        phone,
        email,
        source,
        status,
        first_request_id,
        created_at
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
  payload: ParsedPayload,
  clientId: number
): Promise<number> {
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

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

function getValidationError(payload: ParsedPayload): string | null {
  if (!payload.name.trim()) {
    return "Введите имя.";
  }

  if (normalizePhoneDigits(payload.phone).length < 10) {
    return "Введите корректный телефон.";
  }

  if (!isValidEmail(payload.email)) {
    return "Введите корректный email.";
  }

  return null;
}

function mapSlotError(reason: string): { status: number; error: string; code: string } {
  if (reason === "invalid_service") {
    return {
      status: 400,
      error: "Услуга недоступна для онлайн-записи.",
      code: "invalid_service",
    };
  }

  if (reason === "invalid_date" || reason === "invalid_slot") {
    return {
      status: 400,
      error: "Некорректный слот для записи.",
      code: "invalid_slot",
    };
  }

  if (reason === "outside_booking_window") {
    return {
      status: 409,
      error: "Этот слот уже вне окна онлайн-записи. Пожалуйста, выберите другой.",
      code: "slot_unavailable",
    };
  }

  if (reason === "settings_missing") {
    return {
      status: 500,
      error: "Не удалось загрузить настройки записи.",
      code: "settings_missing",
    };
  }

  return {
    status: 409,
    error: "Выбранный слот уже недоступен. Пожалуйста, выберите другой.",
    code: "slot_unavailable",
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для записи.",
      code: "invalid_payload",
    });
  }

  const validationError = getValidationError(payload);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
      code: "invalid_payload",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await lockBookingDate(client, payload.startsAt);

    const slotValidation = await validateBookableSlot({
      serviceId: payload.serviceId,
      startsAt: payload.startsAt,
      db: client,
    });

    if (!slotValidation.ok) {
      await client.query("ROLLBACK");
      const errorPayload = mapSlotError(slotValidation.reason);
      return res.status(errorPayload.status).json(errorPayload);
    }

    const clientResult = await ensureClient(client, payload);
    const requestId = await createBookedRequest(
      client,
      payload,
      clientResult.clientId
    );
    await setClientFirstRequestIfMissing(
      client,
      clientResult.clientId,
      requestId
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
        RETURNING
          id,
          scheduled_at
      `,
      [
        clientResult.clientId,
        slotValidation.service.id,
        slotValidation.slot.startsAt,
        slotValidation.service.durationMinutes,
        slotValidation.service.price,
        payload.message,
      ]
    );

    await client.query("COMMIT");

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

    try {
      const notificationResult = await sendBookingNotificationsBounded({
        sessionId: response.booking.sessionId,
        clientName: payload.name,
        clientPhone: payload.phone,
        clientEmail: payload.email,
        serviceTitle: response.booking.serviceTitle,
        startsAt: response.booking.startsAt,
        endsAt: response.booking.endsAt,
        comment: payload.message ?? "",
        alreadyExistedClient: response.alreadyExistedClient,
      });

      if (notificationResult.completed) {
        response.notifications = notificationResult.notifications;
      }
    } catch (notificationError) {
      console.error(
        "Public booking bounded notification orchestration error:",
        notificationError
      );
    }

    return res.status(200).json(response);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Public booking create error:", error);
    return res.status(500).json({
      error: "Не удалось создать запись. Попробуйте ещё раз позже.",
      code: "booking_create_failed",
    });
  } finally {
    client.release();
  }
}
