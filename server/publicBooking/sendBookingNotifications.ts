/// <reference types="node" />

import { Resend } from "resend";
import { siteSettings } from "../../src/data/siteSettings";
import {
  formatBookingDate,
  formatBookingTimeRange,
} from "../utils/formatBookingDateTime";

const timezone = siteSettings.booking.timezone;

export type BookingNotificationDeliveryStatus = "sent" | "failed" | "skipped";

export type BookingNotificationChannelResult = {
  status: BookingNotificationDeliveryStatus;
  error?: string;
};

export type BookingNotificationsResult = {
  telegram: BookingNotificationChannelResult;
  ownerEmail: BookingNotificationChannelResult;
  clientEmail: BookingNotificationChannelResult;
};

export type SendBookingNotificationsBoundedResult =
  | {
    completed: true;
    notifications: BookingNotificationsResult;
    timeoutMs: number;
  }
  | {
    completed: false;
    timeoutMs: number;
    reason: "timeout" | "error";
  };

export type SendBookingNotificationsPayload = {
  sessionId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  comment: string;
  alreadyExistedClient: boolean;
};

const BOOKING_NOTIFICATIONS_TIMEOUT_MS = 1500;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getClientKindLabel(alreadyExistedClient: boolean): string {
  return alreadyExistedClient ? "существующий" : "новый";
}

function getOwnerTelegramText(payload: SendBookingNotificationsPayload): string {
  return [
    "Новая online booking запись",
    "",
    `ID session: ${payload.sessionId}`,
    `Клиент: ${payload.clientName}`,
    `Телефон: ${payload.clientPhone}`,
    `Email: ${payload.clientEmail}`,
    `Услуга: ${payload.serviceTitle}`,
    `Дата: ${formatBookingDate(payload.startsAt, timezone)}`,
    `Время: ${formatBookingTimeRange(payload.startsAt, payload.endsAt, timezone)} (${timezone})`,
    `Комментарий: ${payload.comment || "-"}`,
    `Клиент в CRM: ${getClientKindLabel(payload.alreadyExistedClient)}`,
  ].join("\n");
}

function getOwnerEmailHtml(payload: SendBookingNotificationsPayload): string {
  return `
    <h2>Новая online booking запись</h2>
    <p><strong>ID session:</strong> ${payload.sessionId}</p>
    <p><strong>Клиент:</strong> ${escapeHtml(payload.clientName)}</p>
    <p><strong>Телефон:</strong> ${escapeHtml(payload.clientPhone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.clientEmail)}</p>
    <p><strong>Услуга:</strong> ${escapeHtml(payload.serviceTitle)}</p>
    <p><strong>Дата:</strong> ${escapeHtml(formatBookingDate(payload.startsAt, timezone))}</p>
    <p>
  <strong>Время:</strong>
  ${escapeHtml(
    formatBookingTimeRange(payload.startsAt, payload.endsAt, timezone)
  )} (${timezone})
</p>
    <p><strong>Комментарий:</strong> ${escapeHtml(payload.comment || "-")}</p>
    <p><strong>Клиент в CRM:</strong> ${escapeHtml(
    getClientKindLabel(payload.alreadyExistedClient)
  )}</p>
  `;
}

function getClientEmailHtml(payload: SendBookingNotificationsPayload): string {
  return `
    <h2>Запись получена</h2>
    <p>Здравствуйте, ${escapeHtml(payload.clientName)}.</p>
    <p>Ваша запись успешно получена.</p>
    <p><strong>Услуга:</strong> ${escapeHtml(payload.serviceTitle)}</p>
    <p><strong>Дата:</strong> ${escapeHtml(formatBookingDate(payload.startsAt, timezone))}</p>
    <p>
  <strong>Время:</strong>
  ${escapeHtml(
    formatBookingTimeRange(payload.startsAt, payload.endsAt, timezone)
  )} (${timezone})
</p>
    <p>Если потребуется, мы дополнительно свяжемся с вами для уточнения деталей.</p>
  `;
}

async function sendTelegramNotification(
  payload: SendBookingNotificationsPayload
): Promise<BookingNotificationChannelResult> {
  const telegramToken = process.env.TELEGRAM_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !telegramChatId) {
    return {
      status: "skipped",
      error: "Missing Telegram environment variables",
    };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: getOwnerTelegramText(payload),
        }),
      }
    );

    if (!response.ok) {
      return {
        status: "failed",
        error: await response.text(),
      };
    }

    return {
      status: "sent",
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown Telegram error",
    };
  }
}

async function sendOwnerEmail(
  resend: Resend,
  payload: SendBookingNotificationsPayload,
  ownerEmail: string
): Promise<BookingNotificationChannelResult> {
  try {
    const result = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: "Новая online booking запись",
      html: getOwnerEmailHtml(payload),
    });

    if (result.error) {
      return {
        status: "failed",
        error: result.error.message,
      };
    }

    return {
      status: "sent",
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown owner email error",
    };
  }
}

async function sendClientEmail(
  resend: Resend,
  payload: SendBookingNotificationsPayload
): Promise<BookingNotificationChannelResult> {
  try {
    const result = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [payload.clientEmail],
      subject: "Подтверждение записи",
      html: getClientEmailHtml(payload),
    });

    if (result.error) {
      return {
        status: "failed",
        error: result.error.message,
      };
    }

    return {
      status: "sent",
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown client email error",
    };
  }
}

export async function sendBookingNotifications(
  payload: SendBookingNotificationsPayload
): Promise<BookingNotificationsResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  const telegramPromise = sendTelegramNotification(payload);

  let ownerEmailPromise: Promise<BookingNotificationChannelResult>;
  let clientEmailPromise: Promise<BookingNotificationChannelResult>;

  if (!resendApiKey || !ownerEmail) {
    ownerEmailPromise = Promise.resolve({
      status: "skipped",
      error: "Missing email environment variables",
    });
    clientEmailPromise = Promise.resolve({
      status: "skipped",
      error: "Missing email environment variables",
    });
  } else {
    const resend = new Resend(resendApiKey);
    ownerEmailPromise = sendOwnerEmail(resend, payload, ownerEmail);
    clientEmailPromise = sendClientEmail(resend, payload);
  }

  const [telegram, ownerEmailResult, clientEmail] = await Promise.all([
    telegramPromise,
    ownerEmailPromise,
    clientEmailPromise,
  ]);

  if (telegram.status !== "sent") {
    console.error("Booking Telegram notification issue:", {
      sessionId: payload.sessionId,
      status: telegram.status,
      error: telegram.error,
    });
  }

  if (ownerEmailResult.status !== "sent") {
    console.error("Booking owner email notification issue:", {
      sessionId: payload.sessionId,
      status: ownerEmailResult.status,
      error: ownerEmailResult.error,
    });
  }

  if (clientEmail.status !== "sent") {
    console.error("Booking client email notification issue:", {
      sessionId: payload.sessionId,
      status: clientEmail.status,
      error: clientEmail.error,
    });
  }

  return {
    telegram,
    ownerEmail: ownerEmailResult,
    clientEmail,
  };
}

export async function sendBookingNotificationsBounded(
  payload: SendBookingNotificationsPayload,
  options?: {
    timeoutMs?: number;
  }
): Promise<SendBookingNotificationsBoundedResult> {
  const timeoutMs = options?.timeoutMs ?? BOOKING_NOTIFICATIONS_TIMEOUT_MS;
  const notificationsPromise = sendBookingNotifications(payload);

  const timeoutPromise = new Promise<SendBookingNotificationsBoundedResult>(
    (resolve) => {
      setTimeout(() => {
        resolve({
          completed: false,
          timeoutMs,
          reason: "timeout",
        });
      }, timeoutMs);
    }
  );

  const result = await Promise.race([
    notificationsPromise.then<SendBookingNotificationsBoundedResult>(
      (notifications) => ({
        completed: true,
        notifications,
        timeoutMs,
      })
    ),
    timeoutPromise,
  ]).catch((error) => {
    console.error("Booking notifications crashed before response:", {
      sessionId: payload.sessionId,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });

    return {
      completed: false,
      timeoutMs,
      reason: "error",
    } satisfies SendBookingNotificationsBoundedResult;
  });

  if (!result.completed && result.reason === "timeout") {
    console.error("Booking notifications timed out before response:", {
      sessionId: payload.sessionId,
      timeoutMs,
    });

    notificationsPromise.catch((error) => {
      console.error("Booking notifications finished with async error after timeout:", {
        sessionId: payload.sessionId,
        error: error instanceof Error ? error.message : "Unknown notification error",
      });
    });
  }

  return result;
}
