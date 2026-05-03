/// <reference types="node" />

import { pool } from "../../../server/db/pool.js";
import type {
  ClientStatus,
  CrmClientRecord,
  UpdateClientPayload,
} from "../../../src/types/client.js";
import { clientStatuses } from "../../../src/types/client.js";

type ParsedPayload = UpdateClientPayload;

type ClientRow = {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  first_request_id: string | number | null;
  created_at: string;
};

function toClientStatus(value: string): ClientStatus {
  if (clientStatuses.includes(value as ClientStatus)) {
    return value as ClientStatus;
  }

  return "active";
}

function mapClient(row: ClientRow): CrmClientRecord {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    status: toClientStatus(row.status),
    firstRequestId:
      row.first_request_id === null ? null : Number(row.first_request_id),
    createdAt: row.created_at,
  };
}

function parseBody(body: any): ParsedPayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);
  const name = typeof rawBody?.name === "string" ? rawBody.name.trim() : "";
  const phone = typeof rawBody?.phone === "string" ? rawBody.phone.trim() : "";
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const source =
    typeof rawBody?.source === "string" && rawBody.source.trim()
      ? rawBody.source.trim()
      : "manual";
  const status =
    typeof rawBody?.status === "string" ? rawBody.status.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!name) {
    return null;
  }

  if (!phone && !email) {
    return null;
  }

  if (!clientStatuses.includes(status as ClientStatus)) {
    return null;
  }

  return {
    id,
    name,
    phone,
    email,
    source,
    status: status as ClientStatus,
  };
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

async function findDuplicateClientByContacts(
  currentClientId: number,
  phone: string,
  email: string
): Promise<ClientRow | null> {
  const normalizedPhone = normalizePhoneDigits(phone);
  const normalizedEmail = email.trim().toLowerCase();

  const conditions: string[] = [];
  const values: Array<number | string> = [currentClientId];

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

  const result = await pool.query<ClientRow>(
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
      WHERE id <> $1
        AND (${conditions.join(" OR ")})
      ORDER BY created_at ASC
      LIMIT 1
    `,
    values
  );

  return result.rows[0] ?? null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для обновления клиента.",
    });
  }

  try {
    const duplicateClient = await findDuplicateClientByContacts(
      payload.id,
      payload.phone,
      payload.email
    );

    if (duplicateClient) {
      return res.status(400).json({
        error: "Клиент с таким телефоном или email уже существует.",
      });
    }

    const result = await pool.query<ClientRow>(
      `
        UPDATE clients
        SET
          name = $2,
          phone = $3,
          email = $4,
          source = $5,
          status = $6
        WHERE id = $1
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
      [
        payload.id,
        payload.name,
        payload.phone,
        payload.email,
        payload.source,
        payload.status,
      ]
    );

    const updatedClient = result.rows[0];

    if (!updatedClient) {
      return res.status(404).json({
        error: "Клиент не найден.",
      });
    }

    return res.status(200).json({
      success: true,
      item: mapClient(updatedClient),
    });
  } catch (error) {
    console.error("Client update error:", error);
    return res.status(500).json({
      error: "Не удалось обновить клиента",
    });
  }
}
