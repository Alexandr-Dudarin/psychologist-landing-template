import { beforeEach, describe, expect, it, vi } from "vitest";

import { siteSettings } from "../../src/data/siteSettings";

const { poolQueryMock, neutralTermHashes } = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  neutralTermHashes: [
    "06a312de2b09dc0b1819b5185a03706d20f075d292e39b2695c9be3342141d42",
    "790fde32813df77564bfb2169791f0da6a30e99beb5dd25fd89c06f1ae3ad98d",
    "b95989a942ec7136daaca5527cf5b24af66e6bd0053418b7cdc5df9acaebec4d",
  ],
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
}));

vi.mock("../../server/moderation/prohibitedReviewTermHashes", () => ({
  prohibitedReviewTermHashes: neutralTermHashes,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type EligibleClientRow = {
  client_id: number | string;
  reviews_blocked_at: string | null;
  eligibility_session_id: number | string | null;
};

type ReviewRow = {
  id: number | string;
  public_name: string | null;
  rating: number | string | null;
  text: string;
  published_at: string | null;
  created_at: string;
};

const baseEligibleClient: EligibleClientRow = {
  client_id: "77",
  reviews_blocked_at: null,
  eligibility_session_id: "901",
};

const baseReviewRow: ReviewRow = {
  id: "42",
  public_name: "Ирина",
  rating: "5",
  text: "Очень бережная и полезная консультация.",
  published_at: null,
  created_at: "2026-06-01T10:00:00.000Z",
};

function createValidReviewPayload(overrides: Record<string, unknown> = {}) {
  return {
    contact: " Irina@Example.COM ",
    publicName: " Ирина ",
    rating: 5,
    text: "  Очень бережная и полезная консультация.  ",
    consentAccepted: true,
    ...overrides,
  };
}

function createQueryMock(
  handler: (sql: string, values?: unknown[]) => unknown | Promise<unknown>
) {
  const queryLog: QueryLogEntry[] = [];

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });
    return handler(sql, values);
  });

  return queryLog;
}

function mockSuccessfulReviewCreate(options: {
  eligibleClient?: EligibleClientRow;
  reviewRow?: ReviewRow;
} = {}) {
  return createQueryMock((sql) => {
    if (sql.includes("FROM clients c")) {
      return {
        rows: [options.eligibleClient ?? baseEligibleClient],
      };
    }

    if (sql.includes("INSERT INTO client_reviews")) {
      return {
        rows: [options.reviewRow ?? baseReviewRow],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });
}

async function loadClientReviewsService() {
  return import("../../server/reviews/processClientReviews");
}

describe("public client reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    siteSettings.clientReviews.prohibitedContentFilter.enabled = true;
    siteSettings.clientReviews.prohibitedContentFilter.mode = "strict";
    siteSettings.clientReviews.prohibitedContentFilter.maxRepeatedCharacterCount = 15;
    siteSettings.clientReviews.prohibitedContentFilter.maxRepeatedWordCount = 10;
  });

  it("accepts an empty public name and displays the review as anonymous", async () => {
    const queryLog = mockSuccessfulReviewCreate({
      reviewRow: {
        ...baseReviewRow,
        public_name: null,
        rating: null,
      },
    });
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        publicName: "   ",
        rating: null,
      })
    );

    expect(result).toEqual({
      status: 200,
      body: {
        success: true,
        item: {
          id: 42,
          publicName: "Анонимный отзыв",
          rating: null,
          text: "Очень бережная и полезная консультация.",
          publishedAt: null,
          createdAt: "2026-06-01T10:00:00.000Z",
        },
        message:
          "Спасибо! Отзыв отправлен специалисту и появится на сайте после проверки.",
      },
    });
    expect(
      queryLog.find((entry) => entry.sql.includes("INSERT INTO client_reviews"))
        ?.values
    ).toEqual([
      77,
      901,
      null,
      null,
      "Очень бережная и полезная консультация.",
    ]);
  });

  it("rejects public names longer than 35 characters with a clear error", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        publicName: "А".repeat(36),
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({
      code: "invalid_payload",
      error: "Длина псевдонима — не более 35 символов.",
    });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("rejects public names that contain digits with a clear error", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        publicName: "Ирина2",
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({
      code: "invalid_payload",
      error: "Псевдоним не должен содержать цифры.",
    });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("rejects a configured neutral term in review text before database access", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: "Очень с о к рядом.",
      })
    );

    expect(result).toEqual({
      status: 400,
      body: {
        error:
          "Отзыв содержит недопустимые слова или спам-повторы. Измените текст и попробуйте ещё раз.",
        code: "invalid_payload",
      },
    });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("rejects a configured neutral term in public name before database access", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        publicName: "сок",
      })
    );

    expect(result).toEqual({
      status: 400,
      body: {
        error:
          "Псевдоним содержит недопустимые слова или спам-повторы. Измените псевдоним.",
        code: "invalid_payload",
      },
    });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("rejects mixed visual substitutions for a configured neutral term", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: "Очень cоk рядом.",
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ code: "invalid_payload" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("normalizes ё and е when checking configured neutral terms", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: "Очень ёлка рядом.",
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ code: "invalid_payload" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("normalizes й and и when checking configured neutral terms", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: "Очень край рядом.",
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ code: "invalid_payload" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it.each(["с о к", "с.о.к", "с/о/к", "с*о*к"])(
    "rejects a configured neutral term split by separators: %s",
    async (textPart) => {
      const { createClientReview } = await loadClientReviewsService();

      const result = await createClientReview(
        createValidReviewPayload({
          text: `Очень ${textPart} рядом.`,
        })
      );

      expect(result.status).toBe(400);
      expect(result.body).toMatchObject({ code: "invalid_payload" });
      expect(poolQueryMock).not.toHaveBeenCalled();
    }
  );

  it("rejects a stretched configured neutral term", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: "Очень ссооокк рядом.",
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ code: "invalid_payload" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("allows a longer normal word that only contains a configured neutral term as a part", async () => {
    mockSuccessfulReviewCreate();
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: "Соковыжималка стоит на кухне.",
      })
    );

    expect(result.status).toBe(200);
  });

  it("rejects more than 15 repeated normalized letters", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: `${"о".repeat(16)} хорошо`,
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ code: "invalid_payload" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("allows 15 repeated normalized letters by the anti-spam threshold", async () => {
    mockSuccessfulReviewCreate();
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        text: `${"о".repeat(15)} хорошо`,
      })
    );

    expect(result.status).toBe(200);
  });

  it("rejects more than 10 repeated normalized words across separators", async () => {
    const { createClientReview } = await loadClientReviewsService();
    const repeatedWords = Array.from({ length: 11 }, () => "очень").join(",.-");

    const result = await createClientReview(
      createValidReviewPayload({
        text: repeatedWords,
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ code: "invalid_payload" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("allows 10 repeated normalized words by the anti-spam threshold", async () => {
    mockSuccessfulReviewCreate();
    const { createClientReview } = await loadClientReviewsService();
    const repeatedWords = Array.from({ length: 10 }, () => "очень").join(", ");

    const result = await createClientReview(
      createValidReviewPayload({
        text: repeatedWords,
      })
    );

    expect(result.status).toBe(200);
  });

  it("does not block review content when the premium filter is disabled", async () => {
    siteSettings.clientReviews.prohibitedContentFilter.enabled = false;
    mockSuccessfulReviewCreate();
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(
      createValidReviewPayload({
        publicName: "сок",
        text: "Очень с о к рядом.",
      })
    );

    expect(result.status).toBe(200);
  });

  it("allows an omitted rating but rejects ratings outside the allowed range", async () => {
    mockSuccessfulReviewCreate({
      reviewRow: {
        ...baseReviewRow,
        rating: null,
      },
    });
    const { createClientReview } = await loadClientReviewsService();

    const validWithoutRating = await createClientReview(
      createValidReviewPayload({
        rating: undefined,
      })
    );

    expect(validWithoutRating.status).toBe(200);

    vi.clearAllMocks();

    for (const rating of [0, 6, 3.5]) {
      const result = await createClientReview(
        createValidReviewPayload({
          rating,
        })
      );

      expect(result.status).toBe(400);
      expect(result.body).toMatchObject({ code: "invalid_payload" });
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("requires review text and contact verification consent", async () => {
    const { createClientReview } = await loadClientReviewsService();

    const emptyTextResult = await createClientReview(
      createValidReviewPayload({ text: "   " })
    );
    const missingConsentResult = await createClientReview(
      createValidReviewPayload({ consentAccepted: false })
    );

    expect(emptyTextResult.status).toBe(400);
    expect(emptyTextResult.body).toMatchObject({ code: "invalid_payload" });
    expect(missingConsentResult.status).toBe(400);
    expect(missingConsentResult.body).toMatchObject({
      code: "invalid_payload",
      error:
        "Подтвердите согласие на обработку данных для проверки клиента.",
    });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("finds an eligible client by normalized email or phone", async () => {
    const emailQueryLog = mockSuccessfulReviewCreate();
    const { createClientReview } = await loadClientReviewsService();

    await createClientReview(createValidReviewPayload());

    expect(
      emailQueryLog.find((entry) => entry.sql.includes("FROM clients c"))?.values
    ).toEqual(["irina@example.com"]);

    vi.clearAllMocks();

    const phoneQueryLog = mockSuccessfulReviewCreate();

    await createClientReview(
      createValidReviewPayload({
        contact: "+7 (999) 123-45-67",
      })
    );

    expect(
      phoneQueryLog.find((entry) => entry.sql.includes("FROM clients c"))?.values
    ).toEqual(["79991234567"]);
  });

  it("looks for completed or past scheduled sessions when checking eligibility", async () => {
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("FROM clients c")) {
        return { rows: [] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });
    const { createClientReview } = await loadClientReviewsService();

    await createClientReview(createValidReviewPayload());

    const eligibilityQuery = queryLog.find((entry) =>
      entry.sql.includes("eligible_session")
    )?.sql;

    expect(eligibilityQuery).toContain("s.status = 'completed'");
    expect(eligibilityQuery).toContain("s.status = 'scheduled'");
    expect(eligibilityQuery).toContain("s.scheduled_at <= now()");
    expect(eligibilityQuery).not.toContain("cancelled");
    expect(eligibilityQuery).not.toContain("no_show");
  });

  it("rejects clients that are not found in CRM", async () => {
    createQueryMock((sql) => {
      if (sql.includes("FROM clients c")) {
        return { rows: [] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(createValidReviewPayload());

    expect(result).toEqual({
      status: 404,
      body: {
        error:
          "Мы не нашли клиента с таким email или телефоном. Проверьте контакт, который использовали при записи.",
        code: "client_not_found",
      },
    });
  });

  it("rejects clients with manually blocked reviews", async () => {
    mockSuccessfulReviewCreate({
      eligibleClient: {
        ...baseEligibleClient,
        reviews_blocked_at: "2026-06-01T10:00:00.000Z",
      },
    });
    const { createClientReview } = await loadClientReviewsService();

    const result = await createClientReview(createValidReviewPayload());

    expect(result).toEqual({
      status: 403,
      body: {
        error:
          "Сейчас для этого клиента отключена возможность оставлять отзывы.",
        code: "reviews_blocked",
      },
    });
    expect(
      poolQueryMock.mock.calls.some(([sql]) =>
        String(sql).includes("INSERT INTO client_reviews")
      )
    ).toBe(false);
  });

  it.each(["future scheduled", "cancelled", "no_show"])(
    "rejects clients whose only session is %s",
    async () => {
      mockSuccessfulReviewCreate({
        eligibleClient: {
          ...baseEligibleClient,
          eligibility_session_id: null,
        },
      });
      const { createClientReview } = await loadClientReviewsService();

      const result = await createClientReview(createValidReviewPayload());

      expect(result).toEqual({
        status: 403,
        body: {
          error:
            "Отзыв можно оставить после проведённой консультации. Будущая запись, отмена или неявка не дают право оставить отзыв.",
          code: "no_eligible_session",
        },
      });
      expect(
        poolQueryMock.mock.calls.some(([sql]) =>
          String(sql).includes("INSERT INTO client_reviews")
        )
      ).toBe(false);
    }
  );

  it("maps published review rows with normalized numbers and nullable fields", async () => {
    createQueryMock((sql) => {
      if (sql.includes("FROM client_reviews")) {
        return {
          rows: [
            {
              ...baseReviewRow,
              id: "101",
              public_name: "  Анна  ",
              rating: "4",
              published_at: "2026-06-02T10:00:00.000Z",
            },
            {
              ...baseReviewRow,
              id: 102,
              public_name: " ",
              rating: null,
              published_at: null,
            },
          ],
        };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });
    const { listPublishedClientReviews } = await loadClientReviewsService();

    const result = await listPublishedClientReviews();

    expect(result).toEqual({
      status: 200,
      body: {
        items: [
          {
            id: 101,
            publicName: "Анна",
            rating: 4,
            text: "Очень бережная и полезная консультация.",
            publishedAt: "2026-06-02T10:00:00.000Z",
            createdAt: "2026-06-01T10:00:00.000Z",
          },
          {
            id: 102,
            publicName: "Анонимный отзыв",
            rating: null,
            text: "Очень бережная и полезная консультация.",
            publishedAt: null,
            createdAt: "2026-06-01T10:00:00.000Z",
          },
        ],
        hasMore: false,
      },
    });
  });
});
