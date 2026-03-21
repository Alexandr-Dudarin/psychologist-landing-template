/// <reference types="node" />

import { Resend } from "resend";

type RequestBody = {
  name: string;
  phone: string;
  email: string;
  message?: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const telegramToken = process.env.TELEGRAM_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!resendApiKey || !ownerEmail) {
    return res.status(500).json({
      error: "Missing required email environment variables",
    });
  }

  const { name, phone, email, message = "" } = req.body as RequestBody;

  if (!name?.trim() || !phone?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Missing required fields" });
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
      return res.status(500).json({
        error: "Owner email send failed",
        telegramOk,
      });
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
      return res.status(500).json({
        error: "Client email send failed",
        telegramOk,
      });
    }

    return res.status(200).json({
      success: true,
      telegramOk,
    });
  } catch (emailError) {
    console.error("Email send error:", emailError);

    return res.status(500).json({
      error: "Email send failed",
      telegramOk,
    });
  }
}