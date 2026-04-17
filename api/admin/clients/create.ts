/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  ClientStatus,
  CrmClientRecord,
} from "../../../src/types/client";

type ParsedPayload = {
  name: string;
  phone: string;
  email: string;
  source: string;
};

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

function toClientStatus(value: string): ClientStatus {
  if (value === "active" || value === "inactive") {
    return value;
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

  const name =
    typeof rawBody?.name === "string" ? rawBody.name.trim() : "";
  const phone =
    typeof rawBody?.phone === "string" ? rawBody.phone.trim() : "";
  const email =
    typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const source =
    typeof rawBody?.source === "string" && rawBody.source.trim()
      ? rawBody.source.trim()
      : "manual";

  if (!name) {
    return null;
  }

  if (!phone && !email) {
    return null;
  }

  return {
    name,
    phone,
    email,
    source,
  };
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

async function findExistingClientByContacts(
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
      WHERE ${conditions.join(" OR ")}
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
      error: "Invalid payload. Name and at least phone or email are required.",
    });
  }

  try {
    const existingClient = await findExistingClientByContacts(
      payload.phone,
      payload.email
    );

    if (existingClient) {
      return res.status(200).json({
        success: true,
        item: mapClient(existingClient),
        alreadyExisted: true,
      });
    }

    const result = await pool.query<ClientRow>(
      `
        INSERT INTO clients (
          name,
          phone,
          email,
          source,
          status,
          first_request_id
        )
        VALUES ($1, $2, $3, $4, 'active', NULL)
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
      [payload.name, payload.phone, payload.email, payload.source]
    );

    const createdClient = result.rows[0];

    return res.status(200).json({
      success: true,
      item: mapClient(createdClient),
      alreadyExisted: false,
    });
  } catch (error) {
    console.error("Manual client create error:", error);
    return res.status(500).json({ error: "Failed to create client" });
  }
}