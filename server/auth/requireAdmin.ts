import {
  getAdminSessionFromRequest,
  getAdminSessionSecret,
  verifyAdminSessionToken,
} from "./adminSession.js";

type AdminRequestLike = {
  headers?: {
    cookie?: string;
  };
};

type AdminResponseLike = {
  status: (code: number) => {
    json: (payload: { error: string }) => unknown;
  };
};

export function isAdminAuthorizedRequest(req: AdminRequestLike): boolean {
  try {
    const token = getAdminSessionFromRequest(req);

    if (!token) {
      return false;
    }

    return verifyAdminSessionToken(token, getAdminSessionSecret());
  } catch {
    return false;
  }
}

export function requireAdminRequest(
  req: AdminRequestLike,
  res: AdminResponseLike
): boolean {
  if (!isAdminAuthorizedRequest(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}