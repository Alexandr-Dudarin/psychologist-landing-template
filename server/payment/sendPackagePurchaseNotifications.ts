/// <reference types="node" />

import { Resend } from "resend";

export type PackagePurchaseNotificationPayload = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  preferredContact: string;
  packageTitle: string;
  packageCode: string;
  serviceTitle: string;
  totalSessions: number;
  remainingSessions: number;
  price: number;
};

export type PackagePurchaseNotificationStatus = "sent" | "failed" | "skipped";

export type PackagePurchaseNotificationResult = {
  clientEmail: {
    status: PackagePurchaseNotificationStatus;
    error?: string;
  };
  ownerEmail: {
    status: PackagePurchaseNotificationStatus;
    error?: string;
  };
};

type PackagePurchaseNotificationsBoundedResult =
  | {
      completed: true;
      notifications: PackagePurchaseNotificationResult;
      timeoutMs: number;
    }
  | {
      completed: false;
      timeoutMs: number;
      reason: "timeout" | "error";
    };

const PACKAGE_PURCHASE_NOTIFICATIONS_TIMEOUT_MS = 1500;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function getClientEmailHtml(payload: PackagePurchaseNotificationPayload) {
  return `
    <h2>Ваш пакет консультаций оплачен</h2>
    <p>Здравствуйте, ${escapeHtml(payload.clientName)}.</p>
    <p>
      Вы оплатили пакет <strong>${escapeHtml(payload.packageTitle)}</strong>.
    </p>
    <p><strong>Услуга:</strong> ${escapeHtml(payload.serviceTitle)}</p>
    <p><strong>Количество сессий:</strong> ${escapeHtml(String(payload.totalSessions))}</p>
    <p><strong>Код пакета:</strong> ${escapeHtml(payload.packageCode)}</p>
    <p>
      Используйте этот код на странице онлайн-записи, чтобы записываться по пакету.
    </p>
  `;
}

function getOwnerEmailHtml(payload: PackagePurchaseNotificationPayload) {
  return `
    <h2>Новая покупка пакета услуг</h2>
    <p><strong>Клиент:</strong> ${escapeHtml(payload.clientName)}</p>
    <p><strong>Телефон:</strong> ${escapeHtml(payload.clientPhone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.clientEmail)}</p>
    <p><strong>Предпочтительный способ связи:</strong> ${escapeHtml(payload.preferredContact || "-")}</p>
    <p><strong>Пакет:</strong> ${escapeHtml(payload.packageTitle)}</p>
    <p><strong>Услуга:</strong> ${escapeHtml(payload.serviceTitle)}</p>
    <p><strong>Количество сессий:</strong> ${escapeHtml(String(payload.totalSessions))}</p>
    <p><strong>Код пакета:</strong> ${escapeHtml(payload.packageCode)}</p>
    <p><strong>Стоимость:</strong> ${escapeHtml(formatPrice(payload.price))}</p>
  `;
}

async function sendClientEmail(
  resend: Resend,
  payload: PackagePurchaseNotificationPayload
): Promise<PackagePurchaseNotificationResult["clientEmail"]> {
  try {
    const result = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [payload.clientEmail],
      subject: "Код вашего пакета консультаций",
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
      error:
        error instanceof Error ? error.message : "Unknown client email error",
    };
  }
}

async function sendOwnerEmail(
  resend: Resend,
  payload: PackagePurchaseNotificationPayload,
  ownerEmail: string
): Promise<PackagePurchaseNotificationResult["ownerEmail"]> {
  try {
    const result = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: "Новая покупка пакета услуг",
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
      error:
        error instanceof Error ? error.message : "Unknown owner email error",
    };
  }
}

export async function sendPackagePurchaseNotifications(
  payload: PackagePurchaseNotificationPayload
): Promise<PackagePurchaseNotificationResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!resendApiKey) {
    return {
      clientEmail: {
        status: "skipped",
        error: "Missing RESEND_API_KEY",
      },
      ownerEmail: {
        status: "skipped",
        error: "Missing RESEND_API_KEY",
      },
    };
  }

  const resend = new Resend(resendApiKey);

  const [clientEmail, ownerEmailResult] = await Promise.all([
    sendClientEmail(resend, payload),
    ownerEmail
      ? sendOwnerEmail(resend, payload, ownerEmail)
      : Promise.resolve({
          status: "skipped" as const,
          error: "Missing OWNER_EMAIL",
        }),
  ]);

  if (clientEmail.status !== "sent") {
    console.error("Package purchase client email issue:", {
      packageCode: payload.packageCode,
      status: clientEmail.status,
      error: clientEmail.error,
    });
  }

  if (ownerEmailResult.status !== "sent") {
    console.error("Package purchase owner email issue:", {
      packageCode: payload.packageCode,
      status: ownerEmailResult.status,
      error: ownerEmailResult.error,
    });
  }

  return {
    clientEmail,
    ownerEmail: ownerEmailResult,
  };
}

export async function sendPackagePurchaseNotificationsBounded(
  payload: PackagePurchaseNotificationPayload,
  options?: {
    timeoutMs?: number;
  }
): Promise<PackagePurchaseNotificationsBoundedResult> {
  const timeoutMs =
    options?.timeoutMs ?? PACKAGE_PURCHASE_NOTIFICATIONS_TIMEOUT_MS;
  const notificationsPromise = sendPackagePurchaseNotifications(payload);

  const timeoutPromise = new Promise<PackagePurchaseNotificationsBoundedResult>(
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
    notificationsPromise.then<PackagePurchaseNotificationsBoundedResult>(
      (notifications) => ({
        completed: true,
        notifications,
        timeoutMs,
      })
    ),
    timeoutPromise,
  ]).catch((error) => {
    console.error("Package purchase notifications crashed before response:", {
      packageCode: payload.packageCode,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });

    return {
      completed: false,
      timeoutMs,
      reason: "error",
    } satisfies PackagePurchaseNotificationsBoundedResult;
  });

  if (result.completed === false && result.reason === "timeout") {
    console.error("Package purchase notifications timed out before response:", {
      packageCode: payload.packageCode,
      timeoutMs,
    });

    notificationsPromise.catch((error) => {
      console.error(
        "Package purchase notifications finished with async error after timeout:",
        {
          packageCode: payload.packageCode,
          error:
            error instanceof Error ? error.message : "Unknown notification error",
        }
      );
    });
  }

  return result;
}