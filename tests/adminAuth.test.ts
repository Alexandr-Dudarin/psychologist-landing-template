import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAdminSessionCookie,
  buildClearedAdminSessionCookie,
  createAdminSessionToken,
} from "../server/auth/adminSession";
import { createMockRequest, createMockResponse } from "./helpers/http";

const poolQueryMock = vi.fn();

vi.mock("../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
}));

async function loadAuthHandler() {
  const module = await import("../api/admin/auth");
  return module.default;
}

async function loadProtectedScheduleHandler() {
  const module = await import("../api/admin/schedule");
  return module.default;
}

describe("admin auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_PASSWORD = "top-secret";
    process.env.ADMIN_SESSION_SECRET = "session-secret";
  });

  it("does not allow protected access without a valid session", async () => {
    const handler = await loadProtectedScheduleHandler();
    const req = createMockRequest({
      method: "GET",
      headers: {},
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: "Unauthorized" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("logs in with the correct password", async () => {
    const handler = await loadAuthHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "login" },
      body: { password: "top-secret" },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ success: true });
    expect(String(res.headers["Set-Cookie"])).toContain("admin_session=");
  });

  it("rejects login with the wrong password", async () => {
    const handler = await loadAuthHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "login" },
      body: { password: "wrong-password" },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("returns the correct auth state from /api/admin/auth", async () => {
    const handler = await loadAuthHandler();
    const validCookie = buildAdminSessionCookie(
      createAdminSessionToken("session-secret")
    );
    const authorizedReq = createMockRequest({
      method: "GET",
      headers: {
        cookie: validCookie,
      },
    });
    const authorizedRes = createMockResponse();

    await handler(authorizedReq, authorizedRes);

    expect(authorizedRes.statusCode).toBe(200);
    expect(authorizedRes.jsonBody).toEqual({ isAuthorized: true });

    const anonymousReq = createMockRequest({
      method: "GET",
      headers: {},
    });
    const anonymousRes = createMockResponse();

    await handler(anonymousReq, anonymousRes);

    expect(anonymousRes.statusCode).toBe(200);
    expect(anonymousRes.jsonBody).toEqual({ isAuthorized: false });
  });

  it("clears access on logout", async () => {
    const logoutHandler = await loadAuthHandler();
    const meHandler = await loadAuthHandler();
    const req = createMockRequest({
      method: "POST",
      query: { action: "logout" },
    });
    const res = createMockResponse();

    await logoutHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ success: true });
    expect(String(res.headers["Set-Cookie"])).toBe(buildClearedAdminSessionCookie());

    const meReq = createMockRequest({
      method: "GET",
      headers: {
        cookie: String(res.headers["Set-Cookie"]),
      },
    });
    const meRes = createMockResponse();

    await meHandler(meReq, meRes);

    expect(meRes.jsonBody).toEqual({ isAuthorized: false });
  });
});
