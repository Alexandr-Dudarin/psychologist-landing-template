import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_SESSION_COOKIE_NAME = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  iat: number;
  exp: number;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function getAdminPassword(): string {
  const value = process.env.ADMIN_PASSWORD;

  if (!value) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }

  return value;
}

export function getAdminSessionSecret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;

  if (!value) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }

  return value;
}

export function createAdminSessionToken(secret: string): string {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS * 1000,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret: string
): boolean {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload, secret);

  if (!safeCompare(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload)
    ) as AdminSessionPayload;

    return Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function parseCookie(
  cookieHeader: string | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    const [name, ...rest] = part.split("=");

    if (name === cookieName) {
      return rest.join("=") || null;
    }
  }

  return null;
}

export function getAdminSessionFromRequest(req: {
  headers?: { cookie?: string };
}): string | null {
  return parseCookie(req.headers?.cookie, ADMIN_SESSION_COOKIE_NAME);
}

export function buildAdminSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure" : "";
  const expires = new Date(
    Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000
  ).toUTCString();

  return [
    `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
    `Expires=${expires}`,
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildClearedAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure" : "";

  return [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}