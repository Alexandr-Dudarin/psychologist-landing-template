/// <reference types="node" />

import { processPublicRequest } from "../../server/requests/processPublicRequest.js";
import {
  createClientReview,
  listPublishedClientReviews,
} from "../../server/reviews/processClientReviews.js";

function getSingleQueryValue(value: unknown): string {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  return typeof value === "string" ? value : "";
}

function getIntegerQueryValue(value: unknown): number | undefined {
  const rawValue = getSingleQueryValue(value).trim();

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) ? parsedValue : undefined;
}

export default async function handler(req: any, res: any) {
  const action = getSingleQueryValue(req.query?.action).trim();

  if (req.method === "GET") {
    if (action === "list-reviews") {
      const result = await listPublishedClientReviews({
        limit: getIntegerQueryValue(req.query?.limit),
        offset: getIntegerQueryValue(req.query?.offset),
      });

      return res.status(result.status).json(result.body);
    }

    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (action === "create-review") {
    const result = await createClientReview(req.body);

    return res.status(result.status).json(result.body);
  }

  const result = await processPublicRequest(req.body);

  return res.status(result.status).json(result.body);
}