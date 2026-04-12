/// <reference types="node" />

import { pool } from "../../../server/db/pool";
import type {
  RequestStatus,
  UpdateRequestStatusPayload,
} from "../../../src/types/request";
import { requestStatuses } from "../../../src/types/request";

type ParsedPayload = UpdateRequestStatusPayload | null;

function parsePayload(body: any): ParsedPayload {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const id = Number(rawBody?.id);
  const status = rawBody?.status;

  if (!Number.isInteger(id)) {
    return null;
  }

  if (typeof status !== "string") {
    return null;
  }

  if (!requestStatuses.includes(status as RequestStatus)) {
    return null;
  }

  return {
    id,
    status: status as RequestStatus,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = parsePayload(req.body);

  if (!payload) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const result = await pool.query<{ id: number; status: RequestStatus }>(
      `
        UPDATE requests
        SET status = $1
        WHERE id = $2
        RETURNING id, status
      `,
      [payload.status, payload.id]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Request not found" });
    }

    return res.status(200).json({
      success: true,
      item: updated,
    });
  } catch (error) {
    console.error("Request update error:", error);
    return res.status(500).json({ error: "Failed to update request status" });
  }
}