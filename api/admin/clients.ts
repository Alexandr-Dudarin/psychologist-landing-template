/// <reference types="node" />

import { randomInt } from "node:crypto";

import { pool } from "../../server/db/pool.js";
import type {
  AssignClientServicePackagePayload,
  ClientFavoriteFilter,
  ClientServicePackageStatus,
  ClientStatus,
  CrmClientRecord,
  CrmClientServicePackageRecord,
  UpdateClientPayload,
} from "../../src/types/client.js";
import {
  clientFavoriteFilters,
  clientStatuses,
} from "../../src/types/client.js";
import { siteSettings } from "../../src/data/siteSettings.js";
import {
  normalizePreferredContactFields,
  normalizePreferredContactForStorage,
  validatePreferredContactFields,
} from "../../src/lib/preferredContact.js";
import type { PreferredContactMethod } from "../../src/types/preferredContact.js";

const PACKAGE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PACKAGE_CODE_LENGTH = 10;
const PACKAGE_CODE_MAX_ATTEMPTS = 8;

type ParsedCreatePayload = {
  name: string;
  phone: string;
  email: string;
  source: string;
  preferredContactMethod: PreferredContactMethod | "";
  preferredContactValue: string;
};

type ParsedCreateFromRequestPayload = {
  requestId: number;
};

type ParsedUpdatePayload = UpdateClientPayload;

type ParsedToggleFavoritePayload = {
  id: number;
};

type ParsedAssignPackagePayload = AssignClientServicePackagePayload;

type RequestRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
};

type ClientRow = {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  is_favorite: boolean;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
  first_request_id: number | string | null;
  created_at: string;
};

type ClientServicePackageRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  package_plan_id: number | string;
  package_title: string;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  sessions_count: number | string;
  price: number | string;
  code: string;
  status: string;
  used_sessions_count: number | string;
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
    isFavorite: row.is_favorite,
    preferredContactMethod:
      row.preferred_contact_method as PreferredContactMethod | null,
    preferredContactValue: row.preferred_contact_value,
    firstRequestId:
      row.first_request_id === null ? null : Number(row.first_request_id),
    createdAt: row.created_at,
  };
}

function mapClientServicePackage(
  row: ClientServicePackageRow
): CrmClientServicePackageRecord {
  const totalSessions = Number(row.sessions_count);
  const usedSessions = Number(row.used_sessions_count);
  const remainingSessions = Math.max(totalSessions - usedSessions, 0);
  const storedStatus = row.status === "cancelled" ? "cancelled" : "active";

  const status: ClientServicePackageStatus =
    storedStatus === "active" && remainingSessions <= 0
      ? "used"
      : storedStatus;

  return {
    id: Number(row.id),
    clientId: Number(row.client_id),
    clientName: row.client_name,
    packagePlanId: Number(row.package_plan_id),
    packageTitle: row.package_title,
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    serviceDurationMinutes: Number(row.service_duration_minutes),
    totalSessions,
    usedSessions,
    remainingSessions,
    price: Number(row.price),
    code: row.code,
    status,
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

  const name = typeof rawBody?.name === "string" ? rawBody.name.trim() : "";
  const phone = typeof rawBody?.phone === "string" ? rawBody.phone.trim() : "";
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const source =
    typeof rawBody?.source === "string" && rawBody.source.trim()
      ? rawBody.source.trim()
      : "manual";
  const preferredContact = normalizePreferredContactFields(
    rawBody?.preferredContactMethod,
    rawBody?.preferredContactValue
  );

  if (!name) {
    return null;
  }

  if (!phone && !email) {
    return null;
  }

  const preferredContactErrors = validatePreferredContactFields(
    preferredContact,
    siteSettings.preferredContactMethod
  );

  if (
    preferredContactErrors.preferredContactMethod ||
    preferredContactErrors.preferredContactValue
  ) {
    return null;
  }

  return {
    name,
    phone,
    email,
    source,
    preferredContactMethod: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactMethod
      : "",
    preferredContactValue: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactValue
      : "",
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
  const preferredContact = normalizePreferredContactFields(
    rawBody?.preferredContactMethod,
    rawBody?.preferredContactValue
  );

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

  const preferredContactErrors = validatePreferredContactFields(
    preferredContact,
    siteSettings.preferredContactMethod
  );

  if (
    preferredContactErrors.preferredContactMethod ||
    preferredContactErrors.preferredContactValue
  ) {
    return null;
  }

  return {
    id,
    name,
    phone,
    email,
    source,
    status: status as ClientStatus,
    preferredContactMethod: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactMethod
      : "",
    preferredContactValue: siteSettings.preferredContactMethod.enabled
      ? preferredContact.preferredContactValue
      : "",
  };
}

function parseToggleFavoriteBody(body: any): ParsedToggleFavoritePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { id };
}

function parseAssignPackageBody(
  body: any
): ParsedAssignPackagePayload | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const clientId = Number(rawBody?.clientId);
  const packagePlanId = Number(rawBody?.packagePlanId);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null;
  }

  if (!Number.isInteger(packagePlanId) || packagePlanId <= 0) {
    return null;
  }

  return {
    clientId,
    packagePlanId,
  };
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function generatePackageCode(): string {
  let code = "";

  for (let index = 0; index < PACKAGE_CODE_LENGTH; index += 1) {
    code += PACKAGE_CODE_ALPHABET[randomInt(0, PACKAGE_CODE_ALPHABET.length)];
  }

  return code;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
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
        is_favorite,
        preferred_contact_method,
        preferred_contact_value,
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
        is_favorite,
        preferred_contact_method,
        preferred_contact_value,
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

async function selectClient(id: number): Promise<ClientRow | null> {
  const result = await pool.query<ClientRow>(
    `
      SELECT
        id,
        name,
        phone,
        email,
        source,
        status,
        is_favorite,
        preferred_contact_method,
        preferred_contact_value,
        first_request_id,
        created_at
      FROM clients
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

async function selectClientServicePackage(
  id: number | string
): Promise<ClientServicePackageRow | null> {
  const result = await pool.query<ClientServicePackageRow>(
    `
      SELECT
        csp.id,
        csp.client_id,
        c.name AS client_name,
        csp.package_plan_id,
        spp.title AS package_title,
        spp.service_id,
        sv.title AS service_title,
        sv.duration_minutes AS service_duration_minutes,
        spp.sessions_count,
        spp.price,
        csp.code,
        csp.status,
        (
          SELECT COUNT(*)
          FROM sessions s
          WHERE s.client_package_id = csp.id
            AND s.status IN ('scheduled', 'completed', 'no_show')
        ) AS used_sessions_count,
        csp.created_at
      FROM client_service_packages csp
      INNER JOIN clients c ON c.id = csp.client_id
      INNER JOIN service_package_plans spp ON spp.id = csp.package_plan_id
      INNER JOIN services sv ON sv.id = spp.service_id
      WHERE csp.id = $1
      LIMIT 1
    `,
    [id]
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
  const favorite = getSingleQueryValue(req.query?.favorite).trim();
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

  if (favorite && favorite !== "all") {
    if (!clientFavoriteFilters.includes(favorite as ClientFavoriteFilter)) {
      return res.status(400).json({ error: "Invalid favorite filter" });
    }

    conditions.push(`is_favorite = true`);
    conditions.push(`status = 'active'`);
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
        OR preferred_contact_value ILIKE $${searchParamIndex}
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
          is_favorite,
          preferred_contact_method,
          preferred_contact_value,
          first_request_id,
          created_at
        FROM clients
        ${whereClause}
        ORDER BY
          CASE
            WHEN status = 'active' AND is_favorite = true THEN 0
            WHEN status = 'active' THEN 1
            ELSE 2
          END,
          created_at DESC
      `,
      values
    );

    const items: CrmClientRecord[] = result.rows.map(mapClient);

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Clients list error:", error);
    return res.status(500).json({ error: "Failed to load clients" });
  }
}

async function handleListPackages(req: any, res: any) {
  const clientIdRaw = getSingleQueryValue(req.query?.clientId).trim();
  const clientId = Number(clientIdRaw);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ error: "Некорректный клиент" });
  }

  try {
    const client = await selectClient(clientId);

    if (!client) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    const result = await pool.query<ClientServicePackageRow>(
      `
        SELECT
          csp.id,
          csp.client_id,
          c.name AS client_name,
          csp.package_plan_id,
          spp.title AS package_title,
          spp.service_id,
          sv.title AS service_title,
          sv.duration_minutes AS service_duration_minutes,
          spp.sessions_count,
          spp.price,
          csp.code,
          csp.status,
          (
            SELECT COUNT(*)
            FROM sessions s
            WHERE s.client_package_id = csp.id
              AND s.status IN ('scheduled', 'completed', 'no_show')
          ) AS used_sessions_count,
          csp.created_at
        FROM client_service_packages csp
        INNER JOIN clients c ON c.id = csp.client_id
        INNER JOIN service_package_plans spp ON spp.id = csp.package_plan_id
        INNER JOIN services sv ON sv.id = spp.service_id
        WHERE csp.client_id = $1
        ORDER BY
          CASE WHEN csp.status = 'active' THEN 0 ELSE 1 END,
          csp.created_at DESC
      `,
      [clientId]
    );

    const items: CrmClientServicePackageRecord[] = result.rows.map(
      mapClientServicePackage
    );

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Client packages list error:", error);
    return res
      .status(500)
      .json({ error: "Не удалось загрузить пакеты клиента" });
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
    const preferredContact = normalizePreferredContactForStorage({
      preferredContactMethod: payload.preferredContactMethod,
      preferredContactValue: payload.preferredContactValue,
    });

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
          preferred_contact_method,
          preferred_contact_value,
          source,
          status,
          first_request_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', NULL)
        RETURNING
          id,
          name,
          phone,
          email,
          source,
          status,
          is_favorite,
          preferred_contact_method,
          preferred_contact_value,
          first_request_id,
          created_at
      `,
      [
        payload.name,
        payload.phone,
        payload.email,
        preferredContact.preferredContactMethod,
        preferredContact.preferredContactValue,
        payload.source,
      ]
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
          is_favorite,
          preferred_contact_method,
          preferred_contact_value,
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
          preferred_contact_method,
          preferred_contact_value,
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
      if (
        requestRow.preferred_contact_method &&
        requestRow.preferred_contact_value
      ) {
        await pool.query(
          `
            UPDATE clients
            SET
              preferred_contact_method = $2,
              preferred_contact_value = $3
            WHERE id = $1
          `,
          [
            duplicateByContacts.id,
            requestRow.preferred_contact_method,
            requestRow.preferred_contact_value,
          ]
        );
      }

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
          preferred_contact_method,
          preferred_contact_value,
          source,
          status,
          first_request_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
        RETURNING
          id,
          name,
          phone,
          email,
          source,
          status,
          is_favorite,
          preferred_contact_method,
          preferred_contact_value,
          first_request_id,
          created_at
      `,
      [
        requestRow.name,
        requestRow.phone,
        requestRow.email,
        requestRow.preferred_contact_method,
        requestRow.preferred_contact_value,
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
    const preferredContact = normalizePreferredContactForStorage({
      preferredContactMethod: payload.preferredContactMethod ?? "",
      preferredContactValue: payload.preferredContactValue ?? "",
    });

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

    const result = siteSettings.preferredContactMethod.enabled
      ? await pool.query<ClientRow>(
          `
            UPDATE clients
            SET
              name = $2,
              phone = $3,
              email = $4,
              source = $5,
              status = $6,
              is_favorite = CASE WHEN $6 = 'active' THEN is_favorite ELSE false END,
              preferred_contact_method = $7,
              preferred_contact_value = $8
            WHERE id = $1
            RETURNING
              id,
              name,
              phone,
              email,
              source,
              status,
              is_favorite,
              preferred_contact_method,
              preferred_contact_value,
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
            preferredContact.preferredContactMethod,
            preferredContact.preferredContactValue,
          ]
        )
      : await pool.query<ClientRow>(
          `
            UPDATE clients
            SET
              name = $2,
              phone = $3,
              email = $4,
              source = $5,
              status = $6,
              is_favorite = CASE WHEN $6 = 'active' THEN is_favorite ELSE false END
            WHERE id = $1
            RETURNING
              id,
              name,
              phone,
              email,
              source,
              status,
              is_favorite,
              preferred_contact_method,
              preferred_contact_value,
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

async function handleToggleFavorite(req: any, res: any) {
  const payload = parseToggleFavoriteBody(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Некорректный id клиента" });
  }

  try {
    const existingClient = await selectClient(payload.id);

    if (!existingClient) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    if (toClientStatus(existingClient.status) !== "active") {
      return res.status(400).json({
        error: "В избранное можно добавить только активного клиента.",
      });
    }

    const result = await pool.query<ClientRow>(
      `
        UPDATE clients
        SET is_favorite = NOT is_favorite
        WHERE id = $1
        RETURNING
          id,
          name,
          phone,
          email,
          source,
          status,
          is_favorite,
          preferred_contact_method,
          preferred_contact_value,
          first_request_id,
          created_at
      `,
      [payload.id]
    );

    const updatedClient = result.rows[0];

    if (!updatedClient) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    return res.status(200).json({
      success: true,
      item: mapClient(updatedClient),
    });
  } catch (error) {
    console.error("Client favorite toggle error:", error);
    return res.status(500).json({
      error: "Не удалось изменить избранное",
    });
  }
}

async function handleAssignPackage(req: any, res: any) {
  const payload = parseAssignPackageBody(req.body);

  if (!payload) {
    return res.status(400).json({
      error: "Некорректные данные для добавления пакета клиенту.",
    });
  }

  try {
    const client = await selectClient(payload.clientId);

    if (!client) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    if (toClientStatus(client.status) !== "active") {
      return res.status(400).json({
        error: "Пакет можно добавить только активному клиенту.",
      });
    }

    const packagePlanResult = await pool.query<{ id: number | string }>(
      `
        SELECT spp.id
        FROM service_package_plans spp
        INNER JOIN services sv ON sv.id = spp.service_id
        WHERE spp.id = $1
          AND spp.is_active = TRUE
          AND sv.is_active = TRUE
        LIMIT 1
      `,
      [payload.packagePlanId]
    );

    const packagePlan = packagePlanResult.rows[0];

    if (!packagePlan) {
      return res.status(404).json({
        error: "Активный пакет услуг не найден.",
      });
    }

    for (let attempt = 0; attempt < PACKAGE_CODE_MAX_ATTEMPTS; attempt += 1) {
      const code = generatePackageCode();

      try {
        const insertResult = await pool.query<{ id: number | string }>(
          `
            INSERT INTO client_service_packages (
              client_id,
              package_plan_id,
              code,
              status
            )
            VALUES ($1, $2, $3, 'active')
            RETURNING id
          `,
          [payload.clientId, payload.packagePlanId, code]
        );

        const created = insertResult.rows[0];
        const selectedPackage = await selectClientServicePackage(created.id);

        if (!selectedPackage) {
          return res.status(500).json({
            error: "Пакет был создан, но не удалось загрузить его данные.",
          });
        }

        return res.status(200).json({
          success: true,
          item: mapClientServicePackage(selectedPackage),
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    return res.status(500).json({
      error: "Не удалось сформировать уникальный код пакета. Попробуйте ещё раз.",
    });
  } catch (error) {
    console.error("Client package assign error:", error);
    return res.status(500).json({
      error: "Не удалось добавить пакет клиенту",
    });
  }
}

export default async function handler(req: any, res: any) {
  const action = getSingleQueryValue(req.query?.action).trim();

  if (req.method === "GET") {
    if (action === "list-packages") {
      return handleListPackages(req, res);
    }

    return handleList(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (action === "create") {
    return handleCreate(req, res);
  }

  if (action === "create-from-request") {
    return handleCreateFromRequest(req, res);
  }

  if (action === "update") {
    return handleUpdate(req, res);
  }

  if (action === "toggle-favorite") {
    return handleToggleFavorite(req, res);
  }

  if (action === "assign-package") {
    return handleAssignPackage(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}