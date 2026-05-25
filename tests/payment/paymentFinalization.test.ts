import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  connectMock,
  poolQueryMock,
  createBookingServiceMock,
  createClientPackagePurchaseServiceMock,
  sendBookingNotificationsBoundedMock,
  sendPackagePurchaseNotificationsBoundedMock,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  poolQueryMock: vi.fn(),
  createBookingServiceMock: vi.fn(),
  createClientPackagePurchaseServiceMock: vi.fn(),
  sendBookingNotificationsBoundedMock: vi.fn(),
  sendPackagePurchaseNotificationsBoundedMock: vi.fn(),
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    connect: connectMock,
    query: poolQueryMock,
  },
}));

vi.mock("../../server/services/createBookingService", () => ({
  createBookingService: createBookingServiceMock,
  isCreateBookingServiceError: (error: unknown) =>
    error instanceof Error && error.name === "CreateBookingServiceError",
}));

vi.mock("../../server/services/createClientPackagePurchaseService", () => ({
  createClientPackagePurchaseService: createClientPackagePurchaseServiceMock,
  isClientPackagePurchaseError: (error: unknown) =>
    error instanceof Error && error.name === "ClientPackagePurchaseError",
}));

vi.mock("../../server/publicBooking/sendBookingNotifications", () => ({
  sendBookingNotificationsBounded: sendBookingNotificationsBoundedMock,
}));

vi.mock("../../server/payment/sendPackagePurchaseNotifications", () => ({
  sendPackagePurchaseNotificationsBounded:
    sendPackagePurchaseNotificationsBoundedMock,
}));

import { finalizeSuccessfulPayment } from "../../server/payment/finalizeSuccessfulPayment";

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type PaymentRow = {
  id: number | string;
  request_id: string;
  payment_kind: string;
  status: string;
  booking_payload: unknown;
  package_purchase_payload: unknown;
  session_id: number | string | null;
  client_package_id: number | string | null;
};

function createBookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    serviceId: 1,
    startsAt: "2026-04-20T12:00:00.000Z",
    firstName: "  Irina  ",
    lastName: "  Petrova  ",
    phone: "+7 (999) 123-45-67",
    email: "irina@example.com",
    preferredContactMethod: "telegram",
    preferredContactValue: " @irina_test ",
    message: "  Primary consultation  ",
    consent: true,
    ...overrides,
  };
}

function createPackagePurchasePayload(overrides: Record<string, unknown> = {}) {
  return {
    packagePlanId: 42,
    firstName: "  Irina  ",
    lastName: "  Petrova  ",
    phone: "+7 (999) 123-45-67",
    email: "irina@example.com",
    preferredContactMethod: "whatsapp",
    preferredContactValue: " +7 999 123-45-67 ",
    consent: true,
    ...overrides,
  };
}

function createPaymentRow(overrides: Partial<PaymentRow> = {}): PaymentRow {
  return {
    id: 101,
    request_id: "pay_request_1",
    payment_kind: "booking",
    status: "pending",
    booking_payload: createBookingPayload(),
    package_purchase_payload: null,
    session_id: null,
    client_package_id: null,
    ...overrides,
  };
}

function createPoolClient(payment: PaymentRow | null) {
  const queryLog: QueryLogEntry[] = [];
  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [] };
    }

    if (sql.includes("FROM payments") && sql.includes("FOR UPDATE")) {
      return {
        rows: payment ? [payment] : [],
      };
    }

    if (sql.includes("UPDATE payments")) {
      return {
        rows: [],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return {
    client: {
      query,
      release: vi.fn(),
    } as unknown as PoolClient & { release: ReturnType<typeof vi.fn> },
    queryLog,
    query,
  };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

function hasQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.some((entry) => entry.sql.includes(fragment));
}

function createBookingResult(sessionId = 901) {
  return {
    response: {
      success: true,
      booking: {
        sessionId,
        clientId: 501,
        serviceId: 1,
        serviceTitle: "Consultation",
        startsAt: "2026-04-20T12:00:00.000Z",
        endsAt: "2026-04-20T13:00:00.000Z",
      },
      alreadyExistedClient: false,
    },
    notificationPayload: {
      sessionId,
      clientName: "Irina Petrova",
      clientPhone: "+7 (999) 123-45-67",
      clientEmail: "irina@example.com",
      preferredContact: "Telegram: @irina_test",
      serviceTitle: "Consultation",
      startsAt: "2026-04-20T12:00:00.000Z",
      endsAt: "2026-04-20T13:00:00.000Z",
      timezone: "Europe/Moscow",
      comment: "Primary consultation",
      alreadyExistedClient: false,
    },
  };
}

function createPackagePurchaseResult(clientPackageId = 801) {
  return {
    clientPackage: {
      id: clientPackageId,
      code: "PKGTEST001",
      clientId: 501,
      clientName: "Irina Petrova",
      packagePlanId: 42,
      packageTitle: "Package",
      serviceId: 1,
      serviceTitle: "Consultation",
      totalSessions: 4,
      remainingSessions: 4,
      price: 14000,
    },
    alreadyExistedClient: false,
    notificationPayload: {
      clientName: "Irina Petrova",
      clientPhone: "+7 (999) 123-45-67",
      clientEmail: "irina@example.com",
      preferredContact: "WhatsApp: +7 999 123-45-67",
      packageTitle: "Package",
      packageCode: "PKGTEST001",
      serviceTitle: "Consultation",
      totalSessions: 4,
      remainingSessions: 4,
      price: 14000,
    },
  };
}

function createBookingServiceError() {
  const error = new Error("slot unavailable") as Error & {
    status: number;
    code: string;
  };
  error.name = "CreateBookingServiceError";
  error.status = 409;
  error.code = "slot_unavailable";

  return error;
}

function createClientPackagePurchaseError() {
  const error = new Error("package plan inactive") as Error & {
    status: number;
    code: string;
  };
  error.name = "ClientPackagePurchaseError";
  error.status = 409;
  error.code = "package_plan_inactive";

  return error;
}

describe("finalizeSuccessfulPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    poolQueryMock.mockResolvedValue({ rows: [] });
    sendBookingNotificationsBoundedMock.mockResolvedValue({
      completed: true,
      timeoutMs: 1500,
      notifications: {},
    });
    sendPackagePurchaseNotificationsBoundedMock.mockResolvedValue({
      completed: true,
      timeoutMs: 1500,
      notifications: {},
    });
  });

  it("не финализирует повторно уже оплаченный платеж", async () => {
    const { client, queryLog } = createPoolClient(
      createPaymentRow({
        status: "paid",
        session_id: 901,
      })
    );
    connectMock.mockResolvedValue(client);

    const result = await finalizeSuccessfulPayment("pay_request_1");

    expect(result).toEqual({
      success: true,
      alreadyPaid: true,
    });
    expect(createBookingServiceMock).not.toHaveBeenCalled();
    expect(createClientPackagePurchaseServiceMock).not.toHaveBeenCalled();
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(sendPackagePurchaseNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(hasQuery(queryLog, "UPDATE payments")).toBe(false);
    expect(hasQuery(queryLog, "ROLLBACK")).toBe(false);
    expect(hasQuery(queryLog, "COMMIT")).toBe(true);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("финализирует обычную booking-оплату", async () => {
    const { client, queryLog } = createPoolClient(createPaymentRow());
    const bookingResult = createBookingResult(902);
    connectMock.mockResolvedValue(client);
    createBookingServiceMock.mockResolvedValue(bookingResult);

    const result = await finalizeSuccessfulPayment("pay_request_1");

    expect(result).toEqual({
      success: true,
    });
    expect(createBookingServiceMock).toHaveBeenCalledWith(client, {
      serviceId: 1,
      startsAt: "2026-04-20T12:00:00.000Z",
      firstName: "Irina",
      lastName: "Petrova",
      phone: "+7 (999) 123-45-67",
      email: "irina@example.com",
      preferredContactMethod: "telegram",
      preferredContactValue: "@irina_test",
      message: "Primary consultation",
      clientPackageCode: "",
      clientPackageContact: "",
      consent: true,
    });
    expect(createClientPackagePurchaseServiceMock).not.toHaveBeenCalled();

    const paidUpdate = findQuery(queryLog, "UPDATE payments");
    expect(paidUpdate?.sql).toContain("status = 'paid'");
    expect(paidUpdate?.sql).toContain("session_id = $2");
    expect(paidUpdate?.values).toEqual([101, 902]);
    expect(queryLog[queryLog.length - 1]?.sql).toBe("COMMIT");
    expect(sendBookingNotificationsBoundedMock).toHaveBeenCalledWith(
      bookingResult.notificationPayload
    );
    expect(sendPackagePurchaseNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("финализирует покупку пакета услуг", async () => {
    const { client, queryLog } = createPoolClient(
      createPaymentRow({
        payment_kind: "service_package",
        booking_payload: null,
        package_purchase_payload: JSON.stringify(createPackagePurchasePayload()),
      })
    );
    const packageResult = createPackagePurchaseResult(802);
    connectMock.mockResolvedValue(client);
    createClientPackagePurchaseServiceMock.mockResolvedValue(packageResult);

    const result = await finalizeSuccessfulPayment("pay_request_1");

    expect(result).toEqual({
      success: true,
    });
    expect(createClientPackagePurchaseServiceMock).toHaveBeenCalledWith(client, {
      packagePlanId: 42,
      firstName: "Irina",
      lastName: "Petrova",
      phone: "+7 (999) 123-45-67",
      email: "irina@example.com",
      preferredContactMethod: "whatsapp",
      preferredContactValue: "+7 999 123-45-67",
      consent: true,
    });
    expect(createBookingServiceMock).not.toHaveBeenCalled();

    const paidUpdate = findQuery(queryLog, "UPDATE payments");
    expect(paidUpdate?.sql).toContain("status = 'paid'");
    expect(paidUpdate?.sql).toContain("client_package_id = $2");
    expect(paidUpdate?.values).toEqual([101, 802]);
    expect(queryLog[queryLog.length - 1]?.sql).toBe("COMMIT");
    expect(sendPackagePurchaseNotificationsBoundedMock).toHaveBeenCalledWith(
      packageResult.notificationPayload
    );
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("при повторном вызове для paid payment не создает вторую сессию или пакет", async () => {
    const { client, queryLog } = createPoolClient(
      createPaymentRow({
        status: "paid",
        payment_kind: "service_package",
        client_package_id: 802,
        booking_payload: null,
        package_purchase_payload: createPackagePurchasePayload(),
      })
    );
    connectMock.mockResolvedValue(client);

    const result = await finalizeSuccessfulPayment("pay_request_1");

    expect(result).toEqual({
      success: true,
      alreadyPaid: true,
    });
    expect(createBookingServiceMock).not.toHaveBeenCalled();
    expect(createClientPackagePurchaseServiceMock).not.toHaveBeenCalled();
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(sendPackagePurchaseNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(hasQuery(queryLog, "UPDATE payments")).toBe(false);
    expect(hasQuery(queryLog, "COMMIT")).toBe(true);
  });

  it("делает rollback и не помечает payment paid при ошибке booking service", async () => {
    const { client, queryLog } = createPoolClient(createPaymentRow());
    const serviceError = createBookingServiceError();
    connectMock.mockResolvedValue(client);
    createBookingServiceMock.mockRejectedValue(serviceError);

    await expect(finalizeSuccessfulPayment("pay_request_1")).rejects.toBe(
      serviceError
    );

    expect(hasQuery(queryLog, "ROLLBACK")).toBe(true);
    expect(hasQuery(queryLog, "COMMIT")).toBe(false);
    expect(
      queryLog.some(
        (entry) =>
          entry.sql.includes("UPDATE payments") &&
          entry.sql.includes("status = 'paid'")
      )
    ).toBe(false);
    expect(poolQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE payments"),
      ["pay_request_1", "slot unavailable"]
    );
    expect(sendBookingNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("делает rollback и не помечает payment paid при ошибке package purchase service", async () => {
    const { client, queryLog } = createPoolClient(
      createPaymentRow({
        payment_kind: "service_package",
        booking_payload: null,
        package_purchase_payload: createPackagePurchasePayload(),
      })
    );
    const serviceError = createClientPackagePurchaseError();
    connectMock.mockResolvedValue(client);
    createClientPackagePurchaseServiceMock.mockRejectedValue(serviceError);

    await expect(finalizeSuccessfulPayment("pay_request_1")).rejects.toMatchObject({
      name: "PaymentFlowError",
      status: 409,
      code: "package_plan_inactive",
      message: "package plan inactive",
    });

    expect(hasQuery(queryLog, "ROLLBACK")).toBe(true);
    expect(hasQuery(queryLog, "COMMIT")).toBe(false);
    expect(
      queryLog.some(
        (entry) =>
          entry.sql.includes("UPDATE payments") &&
          entry.sql.includes("status = 'paid'")
      )
    ).toBe(false);
    expect(poolQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE payments"),
      ["pay_request_1", "package plan inactive"]
    );
    expect(sendPackagePurchaseNotificationsBoundedMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("по текущей логике обрабатывает неизвестный payment_kind как booking", async () => {
    const { client, queryLog } = createPoolClient(
      createPaymentRow({
        payment_kind: "unexpected_kind",
      })
    );
    const bookingResult = createBookingResult(903);
    connectMock.mockResolvedValue(client);
    createBookingServiceMock.mockResolvedValue(bookingResult);

    const result = await finalizeSuccessfulPayment("pay_request_1");

    expect(result).toEqual({
      success: true,
    });
    expect(createBookingServiceMock).toHaveBeenCalledTimes(1);
    expect(createClientPackagePurchaseServiceMock).not.toHaveBeenCalled();
    expect(findQuery(queryLog, "UPDATE payments")?.values).toEqual([101, 903]);
    expect(hasQuery(queryLog, "COMMIT")).toBe(true);
    expect(hasQuery(queryLog, "ROLLBACK")).toBe(false);
  });

  it("возвращает PaymentFlowError и rollback, если payment не найден", async () => {
    const { client, queryLog } = createPoolClient(null);
    connectMock.mockResolvedValue(client);

    await expect(finalizeSuccessfulPayment("missing")).rejects.toMatchObject({
      name: "PaymentFlowError",
      status: 404,
      code: "payment_not_found",
    });

    expect(hasQuery(queryLog, "ROLLBACK")).toBe(true);
    expect(createBookingServiceMock).not.toHaveBeenCalled();
    expect(createClientPackagePurchaseServiceMock).not.toHaveBeenCalled();
  });
});
