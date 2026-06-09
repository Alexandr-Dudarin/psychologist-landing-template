/// <reference types="node" />

import {
  buildAdminSessionCookie,
  buildClearedAdminSessionCookie,
  createAdminSessionToken,
  getAdminPassword,
  getAdminSessionFromRequest,
  getAdminSessionSecret,
  verifyAdminSessionToken,
} from "../../server/auth/adminSession.js";

type ParsedLoginBody = {
  password: string;
};

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseLoginBody(body: unknown): ParsedLoginBody | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const password =
    typeof (rawBody as ParsedLoginBody | null)?.password === "string"
      ? (rawBody as ParsedLoginBody).password
      : "";

  if (!password.trim()) {
    return null;
  }

  return {
    password,
  };
}

async function handleLogin(req: any, res: any) {
  const parsedBody = parseLoginBody(req.body);

  if (!parsedBody) {
    return res.status(400).json({ error: "Введите пароль." });
  }

  try {
    const adminPassword = getAdminPassword();

    if (parsedBody.password !== adminPassword) {
      return res.status(401).json({ error: "Неверный пароль." });
    }

    const token = createAdminSessionToken(getAdminSessionSecret());

    res.setHeader("Set-Cookie", buildAdminSessionCookie(token));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return res
      .status(500)
      .json({ error: "Не удалось выполнить вход в админку." });
  }
}

async function handleLogout(_req: any, res: any) {
  res.setHeader("Set-Cookie", buildClearedAdminSessionCookie());

  return res.status(200).json({ success: true });
}

async function handleMe(req: any, res: any) {
  try {
    const token = getAdminSessionFromRequest(req);

    if (!token) {
      return res.status(200).json({ isAuthorized: false });
    }

    const sessionSecret = getAdminSessionSecret();
    const isAuthorized = verifyAdminSessionToken(token, sessionSecret);

    if (isAuthorized) {
      const refreshedToken = createAdminSessionToken(sessionSecret);

      res.setHeader("Set-Cookie", buildAdminSessionCookie(refreshedToken));
    }

    return res.status(200).json({ isAuthorized });
  } catch (error) {
    console.error("Admin me error:", error);
    return res.status(200).json({ isAuthorized: false });
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return handleMe(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = getSingleQueryValue(req.query?.action).trim();

  if (action === "login") {
    return handleLogin(req, res);
  }

  if (action === "logout") {
    return handleLogout(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}