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
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  first_request_id: number | null;
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
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    status: toClientStatus(row.status),
    firstRequestId: row.first_request_id,
    createdAt: row.created_at,
  };
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