import { beforeEach, describe, expect, it, vi } from "vitest";

const { resendSendMock, ResendMock } = vi.hoisted(() => {
  const resendSendMock = vi.fn();

  const ResendMock = vi.fn(function Resend() {
    return {
      emails: {
        send: resendSendMock,
      },
    };
  });

  return {
    resendSendMock,
    ResendMock,
  };
});

vi.mock("resend", () => ({
  Resend: ResendMock,
}));

import {
  sendPackagePurchaseNotifications,
  type PackagePurchaseNotificationPayload,
} from "../server/payment/sendPackagePurchaseNotifications";

const fetchMock = vi.fn();

const payload: PackagePurchaseNotificationPayload = {
  clientName: "Максим Верёвкин",
  clientPhone: "+79189990099",
  clientEmail: "nextstep@gmail.com",
  preferredContact: "WhatsApp: +79189990099",
  packageTitle: "Пакет из 4 разовых сессий",
  packageCode: "SVS32PNCRH",
  serviceTitle: "Разовая сессия",
  totalSessions: 4,
  remainingSessions: 4,
  price: 14000,
};

function setNotificationEnv() {
  process.env.RESEND_API_KEY = "test_resend_key";
  process.env.OWNER_EMAIL = "owner@example.com";
  process.env.TELEGRAM_TOKEN = "test_telegram_token";
  process.env.TELEGRAM_CHAT_ID = "123456";
}

function clearNotificationEnv() {
  delete process.env.RESEND_API_KEY;
  delete process.env.OWNER_EMAIL;
  delete process.env.TELEGRAM_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("package purchase notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    clearNotificationEnv();
    setNotificationEnv();

    resendSendMock.mockResolvedValue({
      error: null,
    });

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "",
    });
  });

  it("sends Telegram, client email and owner email for a package purchase", async () => {
    const result = await sendPackagePurchaseNotifications(payload);

    expect(result).toEqual({
      telegram: {
        status: "sent",
      },
      clientEmail: {
        status: "sent",
      },
      ownerEmail: {
        status: "sent",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottest_telegram_token/sendMessage",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    const telegramRequest = fetchMock.mock.calls[0]?.[1] as
      | { body?: string }
      | undefined;
    const telegramBody = JSON.parse(telegramRequest?.body ?? "{}");
    const telegramText = normalizeSpaces(String(telegramBody.text ?? ""));

    expect(telegramBody).toMatchObject({
      chat_id: "123456",
    });

    expect(telegramText).toContain("Новая покупка пакета услуг");
    expect(telegramText).toContain("Клиент: Максим Верёвкин");
    expect(telegramText).toContain("Телефон: +79189990099");
    expect(telegramText).toContain("Email: nextstep@gmail.com");
    expect(telegramText).toContain(
      "Предпочтительный способ связи: WhatsApp: +79189990099"
    );
    expect(telegramText).toContain("Пакет: Пакет из 4 разовых сессий");
    expect(telegramText).toContain("Код пакета: SVS32PNCRH");
    expect(telegramText).toContain("Стоимость: 14 000 ₽");

    expect(ResendMock).toHaveBeenCalledWith("test_resend_key");
    expect(resendSendMock).toHaveBeenCalledTimes(2);

    expect(resendSendMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        from: "Website <onboarding@resend.dev>",
        to: ["nextstep@gmail.com"],
        subject: "Код вашего пакета консультаций",
        html: expect.stringContaining("Ваш пакет консультаций оплачен"),
      })
    );

    expect(resendSendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        from: "Website <onboarding@resend.dev>",
        to: ["owner@example.com"],
        subject: "Новая покупка пакета услуг",
        html: expect.stringContaining("Предпочтительный способ связи"),
      })
    );
  });

  it("keeps email notifications working when Telegram env is missing", async () => {
    delete process.env.TELEGRAM_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const result = await sendPackagePurchaseNotifications(payload);

    expect(result.telegram).toEqual({
      status: "skipped",
      error: "Missing Telegram environment variables",
    });
    expect(result.clientEmail).toEqual({
      status: "sent",
    });
    expect(result.ownerEmail).toEqual({
      status: "sent",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(resendSendMock).toHaveBeenCalledTimes(2);
  });

  it("keeps Telegram notification working when Resend env is missing", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendPackagePurchaseNotifications(payload);

    expect(result.telegram).toEqual({
      status: "sent",
    });
    expect(result.clientEmail).toEqual({
      status: "skipped",
      error: "Missing RESEND_API_KEY",
    });
    expect(result.ownerEmail).toEqual({
      status: "skipped",
      error: "Missing RESEND_API_KEY",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ResendMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("returns failed Telegram status without breaking email notifications", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => "telegram api error",
    });

    const result = await sendPackagePurchaseNotifications(payload);

    expect(result.telegram).toEqual({
      status: "failed",
      error: "telegram api error",
    });
    expect(result.clientEmail).toEqual({
      status: "sent",
    });
    expect(result.ownerEmail).toEqual({
      status: "sent",
    });

    expect(resendSendMock).toHaveBeenCalledTimes(2);
  });
});