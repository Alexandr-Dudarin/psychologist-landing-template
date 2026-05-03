/// <reference types="node" />

import { pool } from "../../server/db/pool.js";
import type {
  ClientStatus,
  CrmClientRecord,
  UpdateClientPayload,
} from "../../src/types/client.js";
import { clientStatuses } from "../../src/types/client.js";

type ParsedCreatePayload = {
  name: string;
  phone: string;
  email: string;
  source: string;
};

type ParsedCreateFromRequestPayload = {
  requestId: number;
};

type ParsedUpdatePayload = UpdateClientPayload;

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
  if (clientStatuses.includes(value as ClientStatus)) {
    return value as ClientStatus;
  }

  return "active";
}

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
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

function parseCreateBody(body: any): ParsedCreatePayload | null {
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

function parseCreateFromRequestBody(
  body: any
): ParsedCreateFromRequestPayload | null {
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

function parseUpdateBody(body: any): ParsedUpdatePayload | null {
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

async function handleList(req: any, res: any) {
  const status = getSingleQueryValue(req.query?.status).trim();
  const search = getSingleQueryValue(req.query?.search).trim();

  const conditions: string[] = [];
  const values: string[] = [];

  if (status && status !== "all") {
    if (!clientStatuses.includes(status as ClientStatus)) {
      return res.status(400).json({ error: "Invalid status filter" });
    }

    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const searchParamIndex = values.length;

    conditions.push(`
      (
        CAST(id AS TEXT) ILIKE $${searchParamIndex}
        OR name ILIKE $${searchParamIndex}
        OR phone ILIKE $${searchParamIndex}
        OR email ILIKE $${searchParamIndex}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
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
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values
    );

    const items: CrmClientRecord[] = result.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      phone: row.phone,
      email: row.email,
      source: row.source,
      status: toClientStatus(row.status),
      firstRequestId:
        row.first_request_id === null ? null : Number(row.first_request_id),
      createdAt: row.created_at,
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Clients list error:", error);
    return res.status(500).json({ error: "Failed to load clients" });
  }
}

async function handleCreate(req: any, res: any) {
  const payload = parseCreateBody(req.body);

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

async function handleCreateFromRequest(req: any, res: any) {
  const payload = parseCreateFromRequestBody(req.body);

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

async function handleUpdate(req: any, res: any) {
  const payload = parseUpdateBody(req.body);

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

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return handleList(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = getSingleQueryValue(req.query?.action).trim();

  if (action === "create") {
    return handleCreate(req, res);
  }

  if (action === "create-from-request") {
    return handleCreateFromRequest(req, res);
  }

  if (action === "update") {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
