/// <reference types="node" />

import { Resend } from "resend";
import { escapeHtml } from "../utils/escapeHtml.js";
import { getTimezoneLabel } from "../../src/lib/booking/getTimezoneLabel.js";
import {
  formatBookingDate,
  formatBookingTimeRange,
} from "../utils/formatBookingDateTime.js";

export const sessionReminderTypes = [
  "specialist_1h",
  "specialist_24h",
  "client_1h",
  "client_24h",
] as const;

export type SessionReminderType = (typeof sessionReminderTypes)[number];

export type SessionReminderDeliveryStatus = "sent" | "failed" | "skipped";

export type SessionReminderChannelResult = {
  status: SessionReminderDeliveryStatus;
  error?: string;
};

export type SessionReminderNotificationsResult = {
  telegram: SessionReminderChannelResult;
  ownerEmail: SessionReminderChannelResult;
  clientEmail: SessionReminderChannelResult;
};

export type SendSessionReminderNotificationsPayload = {
  sessionId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  preferredContact: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  notes: string;
};

function isSpecialistReminderType(reminderType: SessionReminderType): boolean {
  return (
    reminderType === "specialist_1h" || reminderType === "specialist_24h"
  );
}

function isClientReminderType(reminderType: SessionReminderType): boolean {
  return reminderType === "client_1h" || reminderType === "client_24h";
}

function getReminderPrefix(reminderType: SessionReminderType): string {
  if (reminderType === "specialist_1h" || reminderType === "client_1h") {
    return "Напоминание о сессии";
  }

  return "Напоминание о завтрашней сессии";
}

function getDateLabel(startsAt: string, timezone: string): string {
  return formatBookingDate(startsAt, timezone);
}

function getTimeRangeLabel(
  startsAt: string,
  endsAt: string,
  timezone: string
): string {
  return `${formatBookingTimeRange(startsAt, endsAt, timezone)} (${getTimezoneLabel(
    timezone,
    "ru"
  )})`;
}

export function getSubject(
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): string {
  return `${getReminderPrefix(reminderType)} — ${getDateLabel(
    payload.startsAt,
    payload.timezone
  )}, ${getTimeRangeLabel(
    payload.startsAt,
    payload.endsAt,
    payload.timezone
  )}`;
}

export function getSpecialistTelegramText(
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): string {
  return [
    getReminderPrefix(reminderType),
    "",
    `Клиент: ${payload.clientName}`,
    `Телефон: ${payload.clientPhone || "-"}`,
    `Email: ${payload.clientEmail || "-"}`,
    `Предпочтительный способ связи: ${payload.preferredContact || "-"}`,
    `Услуга: ${payload.serviceTitle}`,
    `Дата: ${getDateLabel(payload.startsAt, payload.timezone)}`,
    `Время: ${getTimeRangeLabel(
      payload.startsAt,
      payload.endsAt,
      payload.timezone
    )}`,
    `Заметка: ${payload.notes || "-"}`,
  ].join("\n");
}

export function getSpecialistEmailHtml(
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): string {
  return `
    <h2>${escapeHtml(getReminderPrefix(reminderType))}</h2>
    <p><strong>Клиент:</strong> ${escapeHtml(payload.clientName)}</p>
    <p><strong>Телефон:</strong> ${escapeHtml(payload.clientPhone || "-")}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.clientEmail || "-")}</p>
    <p><strong>Предпочтительный способ связи:</strong> ${escapeHtml(payload.preferredContact || "-")}</p>
    <p><strong>Услуга:</strong> ${escapeHtml(payload.serviceTitle)}</p>
    <p><strong>Дата:</strong> ${escapeHtml(
      getDateLabel(payload.startsAt, payload.timezone)
    )}</p>
    <p><strong>Время:</strong> ${escapeHtml(
      getTimeRangeLabel(payload.startsAt, payload.endsAt, payload.timezone)
    )}</p>
    <p><strong>Заметка:</strong> ${escapeHtml(payload.notes || "-")}</p>
  `;
}

export function getClientEmailHtml(
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): string {
  const intro =
    reminderType === "client_1h"
      ? "Напоминаю о вашей предстоящей сессии."
      : "Напоминаю о вашей завтрашней сессии.";

  return `
    <h2>${escapeHtml(getReminderPrefix(reminderType))}</h2>
    <p>Здравствуйте, ${escapeHtml(payload.clientName)}.</p>
    <p>${escapeHtml(intro)}</p>
    <p><strong>Услуга:</strong> ${escapeHtml(payload.serviceTitle)}</p>
    <p><strong>Дата:</strong> ${escapeHtml(
      getDateLabel(payload.startsAt, payload.timezone)
    )}</p>
    <p><strong>Время:</strong> ${escapeHtml(
      getTimeRangeLabel(payload.startsAt, payload.endsAt, payload.timezone)
    )}</p>
    <p>Если планы изменились, пожалуйста, свяжитесь заранее.</p>
  `;
}

async function sendTelegramReminder(
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): Promise<SessionReminderChannelResult> {
  if (!isSpecialistReminderType(reminderType)) {
    return {
      status: "skipped",
      error: "Telegram reminder is not used for this reminder type",
    };
  }

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
          text: getSpecialistTelegramText(reminderType, payload),
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

async function sendOwnerReminderEmail(
  resend: Resend,
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload,
  ownerEmail: string
): Promise<SessionReminderChannelResult> {
  if (!isSpecialistReminderType(reminderType)) {
    return {
      status: "skipped",
      error: "Owner email reminder is not used for this reminder type",
    };
  }

  try {
    const result = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: getSubject(reminderType, payload),
      html: getSpecialistEmailHtml(reminderType, payload),
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

async function sendClientReminderEmail(
  resend: Resend,
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): Promise<SessionReminderChannelResult> {
  if (!isClientReminderType(reminderType)) {
    return {
      status: "skipped",
      error: "Client email reminder is not used for this reminder type",
    };
  }

  if (!payload.clientEmail.trim()) {
    return {
      status: "skipped",
      error: "Client email is empty",
    };
  }

  try {
    const result = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [payload.clientEmail],
      subject: getSubject(reminderType, payload),
      html: getClientEmailHtml(reminderType, payload),
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

export async function sendSessionReminderNotifications(
  reminderType: SessionReminderType,
  payload: SendSessionReminderNotificationsPayload
): Promise<SessionReminderNotificationsResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  const telegramPromise = sendTelegramReminder(reminderType, payload);

  let ownerEmailPromise: Promise<SessionReminderChannelResult>;
  let clientEmailPromise: Promise<SessionReminderChannelResult>;

  if (!resendApiKey) {
    ownerEmailPromise = Promise.resolve({
      status: "skipped",
      error: "Missing RESEND_API_KEY",
    });

    clientEmailPromise = Promise.resolve({
      status: "skipped",
      error: "Missing RESEND_API_KEY",
    });
  } else {
    const resend = new Resend(resendApiKey);

    if (!ownerEmail) {
      ownerEmailPromise = Promise.resolve({
        status: "skipped",
        error: "Missing OWNER_EMAIL",
      });
    } else {
      ownerEmailPromise = sendOwnerReminderEmail(
        resend,
        reminderType,
        payload,
        ownerEmail
      );
    }

    clientEmailPromise = sendClientReminderEmail(
      resend,
      reminderType,
      payload
    );
  }

  const [telegram, ownerEmailResult, clientEmail] = await Promise.all([
    telegramPromise,
    ownerEmailPromise,
    clientEmailPromise,
  ]);

  if (telegram.status === "failed") {
    console.error("Session reminder Telegram issue:", {
      sessionId: payload.sessionId,
      reminderType,
      error: telegram.error,
    });
  }

  if (ownerEmailResult.status === "failed") {
    console.error("Session reminder owner email issue:", {
      sessionId: payload.sessionId,
      reminderType,
      error: ownerEmailResult.error,
    });
  }

  if (clientEmail.status === "failed") {
    console.error("Session reminder client email issue:", {
      sessionId: payload.sessionId,
      reminderType,
      error: clientEmail.error,
    });
  }

  return {
    telegram,
    ownerEmail: ownerEmailResult,
    clientEmail,
  };
}