/// <reference types="node" />

import {
  getAdminSessionFromRequest,
  getAdminSessionSecret,
  verifyAdminSessionToken,
} from "../../server/auth/adminSession";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = getAdminSessionFromRequest(req);

    if (!token) {
      return res.status(200).json({ isAuthorized: false });
    }

    const isAuthorized = verifyAdminSessionToken(
      token,
      getAdminSessionSecret()
    );

    return res.status(200).json({ isAuthorized });
  } catch (error) {
    console.error("Admin me error:", error);
    return res.status(200).json({ isAuthorized: false });
  }
}