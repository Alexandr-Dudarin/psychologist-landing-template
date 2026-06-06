/// <reference types="node" />

import { pool } from "../db/pool.js";
import { siteSettings } from "../../src/data/siteSettings.js";
import type {
    ClientReviewCreatePayload,
    ClientReviewCreateSuccessResponse,
    ClientReviewErrorResponse,
    ClientReviewListSuccessResponse,
    ClientReviewPublicRecord,
} from "../../src/types/reviews.js";

type ProcessClientReviewResult = {
    status: number;
    body:
    | ClientReviewCreateSuccessResponse
    | ClientReviewListSuccessResponse
    | ClientReviewErrorResponse;
};

type ClientReviewRow = {
    id: number | string;
    public_name: string | null;
    rating: number | string | null;
    text: string;
    published_at: string | null;
    created_at: string;
};

type EligibleClientRow = {
    client_id: number | string;
    reviews_blocked_at: string | null;
    eligibility_session_id: number | string | null;
};

const PUBLIC_NAME_MAX_LENGTH = 35;
const PUBLIC_NAME_DIGITS_PATTERN = /\d/;
const PUBLIC_NAME_LENGTH_ERROR = `Длина псевдонима — не более ${PUBLIC_NAME_MAX_LENGTH} символов.`;
const PUBLIC_NAME_DIGITS_ERROR = "Псевдоним не должен содержать цифры.";

function parseJsonBody(body: unknown): unknown {
    if (typeof body !== "string") {
        return body;
    }

    try {
        return JSON.parse(body);
    } catch {
        return null;
    }
}

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeReviewText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizePhoneDigits(value: string): string {
    return value.replace(/\D/g, "");
}

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function getContactType(value: string): "email" | "phone" | null {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    if (trimmed.includes("@")) {
        return "email";
    }

    return "phone";
}

function parseCreateReviewPayload(
    body: unknown
): ClientReviewCreatePayload | null {
    const rawBody = parseJsonBody(body);

    if (!rawBody || typeof rawBody !== "object") {
        return null;
    }

    const data = rawBody as Record<string, unknown>;
    const contact = normalizeText(data.contact);
    const publicName = normalizeText(data.publicName);
    const text = normalizeReviewText(data.text);
    const consentAccepted = data.consentAccepted === true;

    const rating =
        data.rating === null || data.rating === undefined || data.rating === ""
            ? null
            : Number(data.rating);

    if (!contact || !text) {
        return null;
    }

    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        return null;
    }

    return {
        contact,
        publicName,
        rating,
        text,
        consentAccepted,
    };
}

function mapPublicReview(row: ClientReviewRow): ClientReviewPublicRecord {
    const publicName = row.public_name?.trim() || "Анонимный отзыв";

    return {
        id: Number(row.id),
        publicName,
        rating: row.rating === null ? null : Number(row.rating),
        text: row.text,
        publishedAt: row.published_at,
        createdAt: row.created_at,
    };
}

function getReviewValidationError(payload: ClientReviewCreatePayload): string | null {
    const publicName = payload.publicName?.trim() ?? "";
    const text = payload.text.trim();

    if (!siteSettings.clientReviews.enabled || !siteSettings.clientReviews.publicFormEnabled) {
        return "Форма отзывов сейчас отключена.";
    }

    if (!payload.consentAccepted) {
        return "Подтвердите согласие на обработку данных для проверки клиента.";
    }

    if (!payload.contact.trim()) {
        return "Укажите email или телефон, который использовали при записи.";
    }

    if (publicName.length > PUBLIC_NAME_MAX_LENGTH) {
        return PUBLIC_NAME_LENGTH_ERROR;
    }

    if (PUBLIC_NAME_DIGITS_PATTERN.test(publicName)) {
        return PUBLIC_NAME_DIGITS_ERROR;
    }

    if (text.length < 10) {
        return "Отзыв должен быть не короче 10 символов.";
    }

    if (text.length > 2000) {
        return "Отзыв должен быть не длиннее 2000 символов.";
    }

    return null;
}

async function findEligibleClientByContact(
    contact: string
): Promise<EligibleClientRow | null> {
    const contactType = getContactType(contact);

    if (!contactType) {
        return null;
    }

    const normalizedContact =
        contactType === "email" ? normalizeEmail(contact) : normalizePhoneDigits(contact);

    if (!normalizedContact) {
        return null;
    }

    const contactCondition =
        contactType === "email"
            ? "LOWER(COALESCE(c.email, '')) = $1"
            : "regexp_replace(COALESCE(c.phone, ''), '[^0-9]', '', 'g') = $1";

    const result = await pool.query<EligibleClientRow>(
        `
      SELECT
        c.id AS client_id,
        c.reviews_blocked_at,
        eligible_session.id AS eligibility_session_id
      FROM clients c
      LEFT JOIN LATERAL (
        SELECT s.id
        FROM sessions s
        WHERE s.client_id = c.id
          AND (
            s.status = 'completed'
            OR (
              s.status = 'scheduled'
              AND s.scheduled_at <= now()
            )
          )
        ORDER BY s.scheduled_at DESC, s.id DESC
        LIMIT 1
      ) eligible_session ON true
      WHERE ${contactCondition}
      ORDER BY c.created_at ASC
      LIMIT 1
    `,
        [normalizedContact]
    );

    return result.rows[0] ?? null;
}

export async function listPublishedClientReviews(): Promise<ProcessClientReviewResult> {
    if (
        !siteSettings.clientReviews.enabled ||
        !siteSettings.clientReviews.publicListEnabled
    ) {
        return {
            status: 200,
            body: {
                items: [],
            },
        };
    }

    try {
        const result = await pool.query<ClientReviewRow>(
            `
        SELECT
          id,
          public_name,
          rating,
          text,
          published_at,
          created_at
        FROM client_reviews
        WHERE status = 'published'
          AND deleted_at IS NULL
        ORDER BY published_at DESC NULLS LAST, created_at DESC, id DESC
        LIMIT 50
      `
        );

        return {
            status: 200,
            body: {
                items: result.rows.map(mapPublicReview),
            },
        };
    } catch (error) {
        console.error("List public client reviews error:", error);

        return {
            status: 500,
            body: {
                error: "Не удалось загрузить отзывы.",
                code: "reviews_load_failed",
            },
        };
    }
}

export async function createClientReview(
    body: unknown
): Promise<ProcessClientReviewResult> {
    const payload = parseCreateReviewPayload(body);

    if (!payload) {
        return {
            status: 400,
            body: {
                error: "Некорректные данные отзыва.",
                code: "invalid_payload",
            },
        };
    }

    const validationError = getReviewValidationError(payload);

    if (validationError) {
        return {
            status: 400,
            body: {
                error: validationError,
                code: "invalid_payload",
            },
        };
    }

    try {
        const eligibleClient = await findEligibleClientByContact(payload.contact);

        if (!eligibleClient) {
            return {
                status: 404,
                body: {
                    error:
                        "Мы не нашли клиента с таким email или телефоном. Проверьте контакт, который использовали при записи.",
                    code: "client_not_found",
                },
            };
        }

        if (eligibleClient.reviews_blocked_at !== null) {
            return {
                status: 403,
                body: {
                    error:
                        "Сейчас для этого клиента отключена возможность оставлять отзывы.",
                    code: "reviews_blocked",
                },
            };
        }

        if (eligibleClient.eligibility_session_id === null) {
            return {
                status: 403,
                body: {
                    error:
                        "Отзыв можно оставить после проведённой консультации. Будущая запись, отмена или неявка не дают право оставить отзыв.",
                    code: "no_eligible_session",
                },
            };
        }

        const publicName = payload.publicName?.trim() || null;

        const insertResult = await pool.query<ClientReviewRow>(
            `
        INSERT INTO client_reviews (
          client_id,
          eligibility_session_id,
          public_name,
          rating,
          text,
          status,
          source,
          consent_accepted
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', 'website', true)
        RETURNING
          id,
          public_name,
          rating,
          text,
          published_at,
          created_at
      `,
            [
                Number(eligibleClient.client_id),
                Number(eligibleClient.eligibility_session_id),
                publicName,
                payload.rating ?? null,
                payload.text.trim(),
            ]
        );

        return {
            status: 200,
            body: {
                success: true,
                item: mapPublicReview(insertResult.rows[0]),
                message:
                    "Спасибо! Отзыв отправлен специалисту и появится на сайте после проверки.",
            },
        };
    } catch (error) {
        console.error("Create client review error:", error);

        return {
            status: 500,
            body: {
                error: "Не удалось отправить отзыв. Попробуйте ещё раз позже.",
                code: "review_create_failed",
            },
        };
    }
}