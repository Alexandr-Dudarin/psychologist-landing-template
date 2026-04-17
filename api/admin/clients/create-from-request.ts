/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type { CrmClientRecord, ClientStatus } from "../../../src/types/client";

type RequestBody = {
  requestId: number;
};

type RequestRow = {
  id: number;
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

function parseBody(body: any): RequestBody | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const requestId = Number(rawBody?.requestId);

  if (!Number.isInteger(requestId)) {
    return null;
  }

  return { requestId };
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

async function linkRequestToClient(
  requestId: number,
  clientId: number
): Promise<void> {
  await pool.query(
    `
      UPDATE requests
      SET client_id = $2
      WHERE id = $1
    `,
    [requestId, clientId]
  );
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parseBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const existingClientResult = await pool.query<ClientRow>(
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
        WHERE first_request_id = $1
        LIMIT 1
      `,
      [payload.requestId]
    );

    const existingClient = existingClientResult.rows[0];

    if (existingClient) {
      await linkRequestToClient(payload.requestId, Number(existingClient.id));

      return res.status(200).json({
        success: true,
        item: mapClient(existingClient),
        alreadyExisted: true,
      });
    }

    const requestResult = await pool.query<RequestRow>(
      `
        SELECT
          id,
          name,
          phone,
          email,
          source
        FROM requests
        WHERE id = $1
        LIMIT 1
      `,
      [payload.requestId]
    );

    const requestRow = requestResult.rows[0];

    if (!requestRow) {
      return res.status(404).json({ error: "Request not found" });
    }

    const duplicateByContacts = await findExistingClientByContacts(
      requestRow.phone,
      requestRow.email
    );

    if (duplicateByContacts) {
      await linkRequestToClient(requestRow.id, Number(duplicateByContacts.id));

      return res.status(200).json({
        success: true,
        item: mapClient(duplicateByContacts),
        alreadyExisted: true,
      });
    }

    const insertResult = await pool.query<ClientRow>(
      `
        INSERT INTO clients (
          name,
          phone,
          email,
          source,
          status,
          first_request_id
        )
        VALUES ($1, $2, $3, $4, 'active', $5)
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
        requestRow.name,
        requestRow.phone,
        requestRow.email,
        requestRow.source,
        requestRow.id,
      ]
    );

    const createdClient = insertResult.rows[0];

    await linkRequestToClient(requestRow.id, Number(createdClient.id));

    return res.status(200).json({
      success: true,
      item: mapClient(createdClient),
      alreadyExisted: false,
    });
  } catch (error) {
    console.error("Create client from request error:", error);
    return res.status(500).json({ error: "Failed to create client" });
  }
}