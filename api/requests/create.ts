/// <reference types="node" />

import { processPublicRequest } from "../../server/requests/processPublicRequest.js";
import {
  createClientReview,
  listPublishedClientReviews,
} from "../../server/reviews/processClientReviews.js";
import {
  checkRateLimit,
  sendRateLimitResponse,
  type RateLimitActionKey,
} from "../../server/utils/rateLimit.js";

const PUBLIC_REQUEST_RATE_LIMIT = {
  actionKey: "public_request",
  limit: 5,
  windowMs: 10 * 60 * 1000,
} as const;

const REVIEW_SUBMIT_RATE_LIMIT = {
  actionKey: "review_submit",
  limit: 3,
  windowMs: 30 * 60 * 1000,
} as const;

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

async function ensureRateLimit(
  req: any,
  res: any,
  options: {
    actionKey: RateLimitActionKey;
    limit: number;
    windowMs: number;
  }
): Promise<boolean> {
  const result = await checkRateLimit({
    req,
    actionKey: options.actionKey,
    limit: options.limit,
    windowMs: options.windowMs,
  });

  if (!result.allowed) {
    sendRateLimitResponse(res, result);
    return false;
  }

  return true;
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
    const isAllowed = await ensureRateLimit(req, res, REVIEW_SUBMIT_RATE_LIMIT);

    if (!isAllowed) {
      return;
    }

    const result = await createClientReview(req.body);

    return res.status(result.status).json(result.body);
  }

  const isAllowed = await ensureRateLimit(req, res, PUBLIC_REQUEST_RATE_LIMIT);

  if (!isAllowed) {
    return;
  }

  const result = await processPublicRequest(req.body);

  return res.status(result.status).json(result.body);
}