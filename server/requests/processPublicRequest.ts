/// <reference types="node" />

import { Resend } from "resend";
import { pool } from "../db/pool.js";
import type {
  PublicRequestPayload,
  PublicRequestSuccessResponse,
  PublicRequestErrorResponse,
} from "../../src/types/request.js";
import { siteSettings } from "../../src/data/siteSettings.js";
import {
  formatPreferredContactDisplay,
  normalizePreferredContactFields,
  normalizePreferredContactForStorage,
  validatePreferredContactFields,
} from "../../src/lib/preferredContact.js";

type ProcessPublicRequestResult = {
  status: number;
  body: PublicRequestSuccessResponse | PublicRequestErrorResponse;
};

type ExistingClientRow = {
  id: number | string;
};

function isValidPayload(body: any): body is PublicRequestPayload {
  return (
    typeof body?.firstName === "string" &&
    typeof body?.lastName === "string" &&
    typeof body?.phone === "string" &&
    typeof body?.email === "string"
  );
}

function normalizeNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function buildFullName(firstName: string, lastName: string): string {
  return [normalizeNamePart(firstName), normalizeNamePart(lastName)]
    .filter(Boolean)
    .join(" ");
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

async function findExistingClientIdByContacts(
  phone: string,
  email: string
): Promise<number | null> {
  const normalizedPhone = normalizePhoneDigits(phone);
  const normalizedEmail = email.trim().toLowerCase();

  const conditions: string[] = [];
  const values: string[] = [];

  if (normalizedPhone) {
    values.push(normalizedPhone);
    conditions.push(
      `regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $${values.length}`
    );
  }

  if (normalizedEmail) {
    values.push(normalizedEmail);
    conditions.push(`LOWER(COALESCE(email, '')) = $${values.length}`);
  }

  if (conditions.length === 0) {
    return null;
  }

  const result = await pool.query<ExistingClientRow>(
    `
      SELECT id
      FROM clients
      WHERE ${conditions.join(" OR ")}
      ORDER BY created_at ASC
      LIMIT 1
    `,
    values
  );

  const matchedClient = result.rows[0];

  return matchedClient ? Number(matchedClient.id) : null;
}

export async function processPublicRequest(
  body: unknown
): Promise<ProcessPublicRequestResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const telegramToken = process.env.TELEGRAM_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!resendApiKey || !ownerEmail) {
    return {
      status: 500,
      body: {
        error: "Missing required email environment variables",
      },
    };
  }

  if (!isValidPayload(body)) {
    return {
      status: 400,
      body: {
        error: "Missing required fields",
      },
    };
  }

  const firstName = normalizeNamePart(body.firstName);
  const lastName = normalizeNamePart(body.lastName);
  const name = buildFullName(firstName, lastName);
  const phone = body.phone.trim();
  const email = body.email.trim();
  const message = body.message?.trim() ?? "";
  const preferredContact = normalizePreferredContactFields(
    body.preferredContactMethod,
    body.preferredContactValue
  );
  const storedPreferredContact = normalizePreferredContactForStorage(
    siteSettings.preferredContactMethod.enabled
      ? preferredContact
      : {
          preferredContactMethod: "",
          preferredContactValue: "",
        }
  );
  const preferredContactText = formatPreferredContactDisplay(
    storedPreferredContact.preferredContactMethod,
    storedPreferredContact.preferredContactValue,
    "-"
  );

  if (!firstName || !lastName || !name || !phone || !email) {
    return {
      status: 400,
      body: {
        error: "Missing required fields",
      },
    };
  }

  const preferredContactErrors = validatePreferredContactFields(
    preferredContact,
    siteSettings.preferredContactMethod
  );

  if (
    preferredContactErrors.preferredContactMethod ||
    preferredContactErrors.preferredContactValue
  ) {
    return {
      status: 400,
      body: {
        error:
          preferredContactErrors.preferredContactMethod ??
          preferredContactErrors.preferredContactValue ??
          "Invalid preferred contact",
      },
    };
  }

  try {
    const existingClientId = await findExistingClientIdByContacts(phone, email);

    if (
      existingClientId &&
      storedPreferredContact.preferredContactMethod &&
      storedPreferredContact.preferredContactValue
    ) {
      await pool.query(
        `
          UPDATE clients
          SET
            preferred_contact_method = $2,
            preferred_contact_value = $3
          WHERE id = $1
        `,
        [
          existingClientId,
          storedPreferredContact.preferredContactMethod,
          storedPreferredContact.preferredContactValue,
        ]
      );
    }

    await pool.query(
      `
        INSERT INTO requests (
          name,
          phone,
          email,
          message,
          preferred_contact_method,
          preferred_contact_value,
          status,
          source,
          client_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'new', 'website', $7)
      `,
      [
        name,
        phone,
        email,
        message,
        storedPreferredContact.preferredContactMethod,
        storedPreferredContact.preferredContactValue,
        existingClientId,
      ]
    );

  } catch (dbError) {
    console.error("Request insert error:", dbError);

    return {
      status: 500,
      body: {
        error: "Database save failed",
      },
    };
  }

  const resend = new Resend(resendApiKey);

  let telegramOk = false;
  let telegramErrorMessage = "";

  if (telegramToken && telegramChatId) {
    try {
      const telegramText =
        `Новая заявка с сайта\n\n` +
        `Имя: ${name}\n` +
        `Телефон: ${phone}\n` +
        `Email: ${email}\n` +
        `Предпочтительный способ связи: ${preferredContactText}\n` +
        `Сообщение: ${message || "-"}`;

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${telegramToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: telegramText,
          }),
        }
      );

      if (telegramResponse.ok) {
        telegramOk = true;
      } else {
        telegramErrorMessage = await telegramResponse.text();
        console.error("Telegram error:", telegramErrorMessage);
      }
    } catch (telegramError) {
      telegramErrorMessage =
        telegramError instanceof Error
          ? telegramError.message
          : "Unknown Telegram error";
      console.error("Telegram fetch error:", telegramError);
    }
  }

  try {
    const ownerResult = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: "Новая заявка с сайта",
      html: `
        <h2>Новая заявка</h2>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Предпочтительный способ связи:</strong> ${preferredContactText}</p>
        <p><strong>Сообщение:</strong> ${message || "-"}</p>
        <p><strong>Telegram:</strong> ${telegramOk ? "отправлено" : "не отправлено"}</p>
        ${
          telegramOk
            ? ""
            : `<p><strong>Telegram error:</strong> ${telegramErrorMessage || "нет связи с Telegram API"}</p>`
        }
      `,
    });

    if (ownerResult.error) {
      console.error("Owner email error:", ownerResult.error);
      return {
        status: 500,
        body: {
          error: "Owner email send failed",
          telegramOk,
        },
      };
    }

    const clientResult = await resend.emails.send({
      from: "Website <onboarding@resend.dev>",
      to: [email],
      subject: "Ваша заявка принята",
      html: `
        <h2>Здравствуйте, ${name}!</h2>
        <p>Спасибо за заявку. Она успешно получена.</p>
        <p>Я свяжусь с вами в ближайшее время, чтобы согласовать детали консультации.</p>
      `,
    });

    if (clientResult.error) {
      console.error("Client email error:", clientResult.error);
      return {
        status: 500,
        body: {
          error: "Client email send failed",
          telegramOk,
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        telegramOk,
      },
    };
  } catch (emailError) {
    console.error("Email send error:", emailError);

    return {
      status: 500,
      body: {
        error: "Email send failed",
        telegramOk,
      },
    };
  }
}
