import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockRequest,
  createMockResponse,
  type MockResponse,
} from "../helpers/http";

const { poolQueryMock, finalizeSuccessfulPaymentMock } = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  finalizeSuccessfulPaymentMock: vi.fn(),
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
    connect: vi.fn(),
  },
}));

vi.mock("../../server/payment/finalizeSuccessfulPayment", () => ({
  finalizeSuccessfulPayment: finalizeSuccessfulPaymentMock,
  isPaymentFlowError: () => false,
}));

vi.mock("../../server/services/createBookingService", () => ({
  isCreateBookingServiceError: () => false,
}));

import handler, {
  getRequestIp,
  isIpInYooKassaWebhookAllowlist,
} from "../../api/payment";

const fetchMock = vi.fn();

type ProviderPaymentOverrides = {
  id?: string;
  status?: string;
  requestId?: string;
  cancellationReason?: string;
};

function createWebhookBody(paymentId = "payment_1") {
  return {
    type: "notification",
    event: "payment.succeeded",
    object: {
      id: paymentId,
    },
  };
}

function createProviderPayment(overrides: ProviderPaymentOverrides = {}) {
  return {
    id: overrides.id ?? "payment_1",
    status: overrides.status ?? "waiting_for_capture",
    paid: overrides.status === "succeeded",
    amount: {
      value: "3000.00",
      currency: "RUB",
    },
    metadata: {
      request_id: overrides.requestId ?? "pay_request_1",
    },
    cancellation_details: overrides.cancellationReason
      ? {
          reason: overrides.cancellationReason,
          party: "merchant",
        }
      : null,
  };
}

function mockProviderPayment(overrides: ProviderPaymentOverrides = {}) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => createProviderPayment(overrides),
  });
}

function mockStoredPayment(status = "pending") {
  poolQueryMock.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM payments")) {
      return {
        rows: [
          {
            request_id: "pay_request_1",
            status,
            provider_payment_id: "payment_1",
          },
        ],
      };
    }

    return { rows: [] };
  });
}

async function callWebhook(params: {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
} = {}): Promise<MockResponse> {
  const req = createMockRequest({
    method: "POST",
    headers: params.headers ?? {},
    query: {
      action: "webhook",
      ...(params.query ?? {}),
    },
    body: params.body ?? createWebhookBody(),
  }) as VercelRequest;
  const res = createMockResponse() as unknown as VercelResponse;

  await handler(req, res);

  return res as unknown as MockResponse;
}

describe("YooKassa webhook security helpers", () => {
  it("проверяет IPv4 CIDR и одиночные YooKassa IP", () => {
    expect(isIpInYooKassaWebhookAllowlist("185.71.76.5")).toBe(true);
    expect(isIpInYooKassaWebhookAllowlist("185.71.76.40")).toBe(false);
    expect(isIpInYooKassaWebhookAllowlist("77.75.156.11")).toBe(true);
    expect(isIpInYooKassaWebhookAllowlist("77.75.156.35")).toBe(true);
  });

  it("берет первый IP из x-forwarded-for", () => {
    const req = createMockRequest({
      headers: {
        "x-forwarded-for": "203.0.113.10, 185.71.76.5",
      },
    }) as VercelRequest;

    expect(getRequestIp(req)).toBe("203.0.113.10");
  });
});

describe("YooKassa webhook security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    process.env.YOOKASSA_SHOP_ID = "shop-id";
    process.env.YOOKASSA_SECRET_KEY = "server-api-secret";
    delete process.env.YOOKASSA_WEBHOOK_SECRET;
    finalizeSuccessfulPaymentMock.mockResolvedValue({ success: true });
    mockStoredPayment();
  });

  it("пропускает allowed YooKassa IPv4 дальше до provider lookup", async () => {
    mockProviderPayment();

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.yookassa.ru/v3/payments/payment_1"
    );
  });

  it("блокирует IP не из allowlist до provider lookup", async () => {
    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    });

    expect(res.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(finalizeSuccessfulPaymentMock).not.toHaveBeenCalled();
  });

  it("блокирует webhook без IP header до provider lookup", async () => {
    const res = await callWebhook();

    expect(res.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(poolQueryMock).not.toHaveBeenCalled();
    expect(finalizeSuccessfulPaymentMock).not.toHaveBeenCalled();
  });

  it("использует первый IP из x-forwarded-for для allowlist", async () => {
    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "203.0.113.10, 185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("не требует webhook secret, если YOOKASSA_WEBHOOK_SECRET не задан", async () => {
    mockProviderPayment();

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("при заданном YOOKASSA_WEBHOOK_SECRET блокирует missing secret до provider lookup", async () => {
    process.env.YOOKASSA_WEBHOOK_SECRET = "webhook-secret";

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("при заданном YOOKASSA_WEBHOOK_SECRET блокирует неверный secret до provider lookup", async () => {
    process.env.YOOKASSA_WEBHOOK_SECRET = "webhook-secret";

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
      query: {
        secret: "wrong-secret",
      },
    });

    expect(res.statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("принимает верный query secret и продолжает до provider lookup", async () => {
    process.env.YOOKASSA_WEBHOOK_SECRET = "webhook-secret";
    mockProviderPayment();

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
      query: {
        secret: "webhook-secret",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("принимает верный x-webhook-secret header и продолжает до provider lookup", async () => {
    process.env.YOOKASSA_WEBHOOK_SECRET = "webhook-secret";
    mockProviderPayment();

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
        "x-webhook-secret": "webhook-secret",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("не запускает provider lookup для malformed webhook body после успешного security-check", async () => {
    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
      body: {
        event: "payment.succeeded",
        object: {},
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ received: true, ignored: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(finalizeSuccessfulPaymentMock).not.toHaveBeenCalled();
  });

  it("сохраняет succeeded webhook flow с provider lookup и финализацией", async () => {
    mockProviderPayment({ status: "succeeded" });

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ received: true, finalized: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(finalizeSuccessfulPaymentMock).toHaveBeenCalledWith("pay_request_1");
  });

  it("сохраняет already-paid webhook flow без повторной финализации", async () => {
    mockStoredPayment("paid");
    mockProviderPayment({ status: "succeeded" });

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ received: true, alreadyPaid: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(finalizeSuccessfulPaymentMock).not.toHaveBeenCalled();
  });

  it("сохраняет canceled webhook flow", async () => {
    mockProviderPayment({
      status: "canceled",
      cancellationReason: "expired_on_capture",
    });

    const res = await callWebhook({
      headers: {
        "x-forwarded-for": "185.71.76.5",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ received: true, cancelled: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(finalizeSuccessfulPaymentMock).not.toHaveBeenCalled();
    expect(poolQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE payments"),
      ["pay_request_1", "Оплата отменена: expired_on_capture"]
    );
  });
});
