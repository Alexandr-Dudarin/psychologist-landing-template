/// <reference types="node" />

import { Resend } from "resend";

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getBookingDateLabel(startsAt: string): string {
  return startsAt.slice(0, 10) || "-";
}

function getBookingTimeLabel(startsAt: string, endsAt: string): string {
  const startTime = startsAt.slice(11, 16) || "--:--";
  const endTime = endsAt.slice(11, 16) || "--:--";
  return `${startTime} - ${endTime}`;
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
    `Дата: ${getBookingDateLabel(payload.startsAt)}`,
    `Время: ${getBookingTimeLabel(payload.startsAt, payload.endsAt)}`,
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
    <p><strong>Дата:</strong> ${escapeHtml(getBookingDateLabel(payload.startsAt))}</p>
    <p><strong>Время:</strong> ${escapeHtml(
      getBookingTimeLabel(payload.startsAt, payload.endsAt)
    )}</p>
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
    <p><strong>Дата:</strong> ${escapeHtml(getBookingDateLabel(payload.startsAt))}</p>
    <p><strong>Время:</strong> ${escapeHtml(
      getBookingTimeLabel(payload.startsAt, payload.endsAt)
    )}</p>
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
