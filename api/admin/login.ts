/// <reference types="node" />

import {
  buildAdminSessionCookie,
  createAdminSessionToken,
  getAdminPassword,
  getAdminSessionSecret,
} from "../../server/auth/adminSession";

type ParsedBody = {
  password: string;
};

function parseBody(body: unknown): ParsedBody | null {
  let rawBody = body;

  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  const password =
    typeof (rawBody as ParsedBody | null)?.password === "string"
      ? (rawBody as ParsedBody).password
      : "";

  if (!password.trim()) {
    return null;
  }

  return {
    password,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsedBody = parseBody(req.body);

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