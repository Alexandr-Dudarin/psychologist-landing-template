/// <reference types="node" />

import { createHash } from "node:crypto";

import { pool } from "../db/pool.js";

type Queryable = {
  query: <Row = unknown>(
    text: string,
    values?: unknown[]
  ) => Promise<{ rows: Row[] }>;
};

type RateLimitRequest = {
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

export type RateLimitActionKey =
  | "public_request"
  | "review_submit"
  | "booking_create"
  | "package_lookup"
  | "payment_create";

export type RateLimitOptions = {
  req: RateLimitRequest;
  actionKey: RateLimitActionKey;
  limit: number;
  windowMs: number;
  db?: Queryable;
};

export type RateLimitResult = {
  allowed: boolean;
  actionKey: RateLimitActionKey;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: string;
};

type RateLimitRow = {
  request_count: number | string;
};

function getHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeRequestIp(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("[") && trimmedValue.includes("]")) {
    return trimmedValue.slice(1, trimmedValue.indexOf("]")).trim();
  }

  const ipv4WithPort = trimmedValue.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);

  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  return trimmedValue;
}

export function getRateLimitRequestIp(req: RateLimitRequest): string {
  const headerNames = [
    "x-forwarded-for",
    "x-vercel-forwarded-for",
    "x-real-ip",
    "true-client-ip",
  ] as const;

  for (const headerName of headerNames) {
    const headerValue = getHeaderValue(req.headers?.[headerName]);

    if (!headerValue.trim()) {
      continue;
    }

    const firstIp = headerValue.split(",")[0]?.trim();

    if (firstIp) {
      return normalizeRequestIp(firstIp);
    }
  }

  return normalizeRequestIp(req.socket?.remoteAddress ?? "unknown");
}

function getRateLimitSalt(): string {
  return (
    process.env.RATE_LIMIT_SALT?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    "development-rate-limit-salt"
  );
}

function hashIdentifier(value: string): string {
  return createHash("sha256")
    .update(`${getRateLimitSalt()}:${value}`)
    .digest("hex");
}

function getWindowStart(now: number, windowMs: number): Date {
  return new Date(Math.floor(now / windowMs) * windowMs);
}

function getResetAt(windowStart: Date, windowMs: number): Date {
  return new Date(windowStart.getTime() + windowMs);
}

export async function checkRateLimit({
  req,
  actionKey,
  limit,
  windowMs,
  db = pool,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = getWindowStart(now, windowMs);
  const resetAt = getResetAt(windowStart, windowMs);
  const requestIp = getRateLimitRequestIp(req);
  const identifierHash = hashIdentifier(requestIp);

  const result = await db.query<RateLimitRow>(
    `
      INSERT INTO rate_limits (
        action_key,
        identifier_hash,
        window_start,
        request_count
      )
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (action_key, identifier_hash, window_start)
      DO UPDATE SET
        request_count = rate_limits.request_count + 1,
        updated_at = NOW()
      RETURNING request_count
    `,
    [actionKey, identifierHash, windowStart.toISOString()]
  );

  const requestCount = Number(result.rows[0]?.request_count ?? 1);
  const allowed = requestCount <= limit;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resetAt.getTime() - now) / 1000)
  );

  return {
    allowed,
    actionKey,
    limit,
    remaining: Math.max(limit - requestCount, 0),
    retryAfterSeconds,
    resetAt: resetAt.toISOString(),
  };
}

export function sendRateLimitResponse(
  res: {
    status: (statusCode: number) => {
      json: (body: unknown) => unknown;
      setHeader?: (name: string, value: string) => void;
    };
    setHeader?: (name: string, value: string) => void;
  },
  result: RateLimitResult
) {
  res.setHeader?.("Retry-After", String(result.retryAfterSeconds));
  res.setHeader?.("X-RateLimit-Limit", String(result.limit));
  res.setHeader?.("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader?.("X-RateLimit-Reset", result.resetAt);

  return res.status(429).json({
    error: "Слишком много попыток. Попробуйте ещё раз через несколько минут.",
    code: "rate_limit_exceeded",
    retryAfterSeconds: result.retryAfterSeconds,
  });
}