import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../helpers/http";

const { poolQueryMock, requireAdminRequestMock } = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  requireAdminRequestMock: vi.fn(),
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
}));

vi.mock("../../server/auth/requireAdmin", () => ({
  requireAdminRequest: requireAdminRequestMock,
}));

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type ClientReviewRow = {
  id: number | string;
  client_id: number | string;
  client_name: string;
  client_phone: string;
  client_email: string;
  eligibility_session_id: number | string | null;
  public_name: string | null;
  rating: number | string | null;
  text: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  hidden_at: string | null;
  deleted_at: string | null;
};

const baseReviewRow: ClientReviewRow = {
  id: "42",
  client_id: "77",
  client_name: "Ирина Петрова",
  client_phone: "+79189990099",
  client_email: "irina@example.com",
  eligibility_session_id: "901",
  public_name: "  Анна  ",
  rating: "5",
  text: "Очень бережная и полезная консультация.",
  status: "pending",
  admin_note: "Проверено",
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T11:00:00.000Z",
  published_at: null,
  hidden_at: null,
  deleted_at: null,
};

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

async function loadClientsHandler() {
  const module = await import("../../api/admin/clients");
  return module.default;
}

describe("admin client reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
  });

  it("lists reviews with mapped and normalized admin fields", async () => {
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("FROM client_reviews r");
      expect(sql).toContain("INNER JOIN clients c");

      return {
        rows: [
          baseReviewRow,
          {
            ...baseReviewRow,
            id: 43,
            client_id: 78,
            eligibility_session_id: null,
            public_name: " ",
            rating: null,
            status: "unexpected",
            admin_note: null,
            published_at: "2026-06-02T10:00:00.000Z",
            hidden_at: "2026-06-03T10:00:00.000Z",
            deleted_at: "2026-06-04T10:00:00.000Z",
          },
        ],
      };
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "GET",
        query: { action: "list-reviews", status: "all" },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 42,
          clientId: 77,
          clientName: "Ирина Петрова",
          clientPhone: "+79189990099",
          clientEmail: "irina@example.com",
          eligibilitySessionId: 901,
          publicName: "Анна",
          rating: 5,
          text: "Очень бережная и полезная консультация.",
          status: "pending",
          adminNote: "Проверено",
          createdAt: "2026-06-01T10:00:00.000Z",
          publishedAt: null,
          hiddenAt: null,
          deletedAt: null,
        },
        {
          id: 43,
          clientId: 78,
          clientName: "Ирина Петрова",
          clientPhone: "+79189990099",
          clientEmail: "irina@example.com",
          eligibilitySessionId: null,
          publicName: "Анонимный отзыв",
          rating: null,
          text: "Очень бережная и полезная консультация.",
          status: "pending",
          adminNote: "",
          createdAt: "2026-06-01T10:00:00.000Z",
          publishedAt: "2026-06-02T10:00:00.000Z",
          hiddenAt: "2026-06-03T10:00:00.000Z",
          deletedAt: "2026-06-04T10:00:00.000Z",
        },
      ],
      hasMore: false,
    });
    expect(queryLog[0]?.values).toEqual([]);
  });

  it("applies review status filters and pagination to the list query", async () => {
    const queryLog = createQueryMock(() => ({
      rows: [
        { ...baseReviewRow, id: "1", status: "published" },
        { ...baseReviewRow, id: "2", status: "published" },
        { ...baseReviewRow, id: "3", status: "published" },
      ],
    }));
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "GET",
        query: {
          action: "list-reviews",
          status: "published",
          limit: "2",
          offset: "4",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({ hasMore: true });
    expect((res.jsonBody as { items: unknown[] }).items).toHaveLength(2);
    expect(queryLog[0]?.sql).toContain("r.status = $1");
    expect(queryLog[0]?.sql).toContain("LIMIT $2 OFFSET $3");
    expect(queryLog[0]?.values).toEqual(["published", 3, 4]);
  });

  it.each([
    ["pending to published", "published"],
    ["published to hidden", "hidden"],
    ["hidden to published", "published"],
    ["review to deleted", "deleted"],
  ])("allows moderation transition from %s", async (_label, status) => {
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("UPDATE client_reviews");

      return {
        rows: [
          {
            ...baseReviewRow,
            status,
            admin_note: "Внутренняя заметка",
          },
        ],
      };
    });
    const handler = await loadClientsHandler();
    const res = createMockResponse();

    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update-review" },
        body: {
          id: "42",
          status,
          adminNote: "  Внутренняя заметка  ",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 42,
        status,
        adminNote: "Внутренняя заметка",
      },
      message: "Отзыв обновлён.",
    });
    expect(queryLog[0]?.values).toEqual([
      42,
      status,
      "Внутренняя заметка",
    ]);
  });

  it("rejects invalid moderation payloads before DB access", async () => {
    const queryLog = createQueryMock(() => {
      throw new Error("DB should not be called");
    });
    const handler = await loadClientsHandler();

    for (const body of [
      "{bad json",
      { id: 0, status: "published" },
      { id: 42, status: "approved" },
    ]) {
      const res = createMockResponse();

      await handler(
        createMockRequest({
          method: "POST",
          query: { action: "update-review" },
          body,
        }),
        res
      );

      expect(res.statusCode).toBe(400);
      expect(String((res.jsonBody as { error?: string }).error)).toBeTruthy();
    }

    expect(queryLog).toHaveLength(0);
  });

  it("returns safe errors for review list and moderation DB failures", async () => {
    const handler = await loadClientsHandler();

    createQueryMock(() => {
      throw new Error("list reviews db failure");
    });
    const listRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "GET",
        query: { action: "list-reviews" },
      }),
      listRes
    );

    createQueryMock(() => {
      throw new Error("moderation db failure");
    });
    const updateRes = createMockResponse();
    await handler(
      createMockRequest({
        method: "POST",
        query: { action: "update-review" },
        body: { id: 42, status: "published" },
      }),
      updateRes
    );

    expect(listRes.statusCode).toBe(500);
    expect(listRes.jsonBody).toEqual({ error: "Не удалось загрузить отзывы" });
    expect(updateRes.statusCode).toBe(500);
    expect(updateRes.jsonBody).toEqual({ error: "Не удалось обновить отзыв" });
  });
});
