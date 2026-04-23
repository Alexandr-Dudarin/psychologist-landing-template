import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQueryMock = vi.fn();
const resendSendMock = vi.fn();

vi.mock("../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return {
      emails: {
        send: resendSendMock,
      },
    };
  }),
}));

async function loadProcessPublicRequest() {
  const module = await import("../server/requests/processPublicRequest");
  return module.processPublicRequest;
}

describe("public request create flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.OWNER_EMAIL = "owner@example.com";
    delete process.env.TELEGRAM_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  it("builds a single trimmed name from firstName and lastName", async () => {
    poolQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 801 }] });
    resendSendMock.mockResolvedValue({ error: null });

    const processPublicRequest = await loadProcessPublicRequest();
    const result = await processPublicRequest({
      firstName: "  Irina   Maria ",
      lastName: "  Petrova  ",
      phone: "+7 (999) 123-45-67",
      email: "irina@example.com",
      message: "Need a consultation",
    });

    expect(result).toEqual({
      status: 200,
      body: {
        success: true,
        telegramOk: false,
      },
    });
    expect(poolQueryMock.mock.calls[1][1]).toEqual([
      "Irina Maria Petrova",
      "+7 (999) 123-45-67",
      "irina@example.com",
      "Need a consultation",
      null,
    ]);
    expect(resendSendMock.mock.calls[0][0].html).toContain(
      "Irina Maria Petrova"
    );
    expect(resendSendMock.mock.calls[1][0].html).toContain(
      "Irina Maria Petrova"
    );
  });

  it("requires both firstName and lastName", async () => {
    const processPublicRequest = await loadProcessPublicRequest();
    const result = await processPublicRequest({
      firstName: "Irina",
      lastName: " ",
      phone: "+7 (999) 123-45-67",
      email: "irina@example.com",
    });

    expect(result.status).toBe(400);
    expect(poolQueryMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
  });
});
