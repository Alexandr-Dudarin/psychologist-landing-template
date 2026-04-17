/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  CrmClientRecord,
  ClientStatus,
  UpdateClientStatusPayload,
} from "../../../src/types/client";
import { clientStatuses } from "../../../src/types/client";

type ParsedPayload = UpdateClientStatusPayload;

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
  if (clientStatuses.includes(value as ClientStatus)) {
    return value as ClientStatus;
  }

  return "active";
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
  const status =
    typeof rawBody?.status === "string" ? rawBody.status.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!clientStatuses.includes(status as ClientStatus)) {
    return null;
  }

  return {
    id,
    status: status as ClientStatus,
  };
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
    const result = await pool.query<ClientRow>(
      `
        UPDATE clients
        SET status = $2
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
      [payload.id, payload.status]
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
