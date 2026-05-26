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

type NoteRow = {
  id: string | number;
  client_id: string | number;
  client_name: string;
  session_id: string | number | null;
  session_scheduled_at: string | null;
  session_service_title: string | null;
  content: string;
  created_at: string;
};

function noteRow(overrides: Partial<NoteRow> = {}): NoteRow {
  return {
    id: "701",
    client_id: "501",
    client_name: "Irina Petrova",
    session_id: null,
    session_scheduled_at: null,
    session_service_title: null,
    content: "Private note",
    created_at: "2027-06-01T09:00:00.000Z",
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

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

async function loadNotesHandler() {
  const module = await import("../../api/admin/notes");
  return module.default;
}

async function callAdminNotes(
  overrides: Parameters<typeof createMockRequest>[0]
) {
  const handler = await loadNotesHandler();
  const res = createMockResponse();

  await handler(createMockRequest(overrides), res);

  return res;
}

describe("admin notes API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    requireAdminRequestMock.mockReturnValue(true);
  });

  it("lists notes with mapped frontend fields for notes with and without sessions", async () => {
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("FROM notes n");
      expect(sql).toContain("LEFT JOIN sessions s");
      expect(sql).toContain("LEFT JOIN services sv");
      expect(sql).toContain("ORDER BY n.created_at DESC");

      return {
        rows: [
          noteRow(),
          noteRow({
            id: "702",
            client_id: "502",
            client_name: "Maria Sokolova",
            session_id: "901",
            session_scheduled_at: "2027-06-02T12:00:00.000Z",
            session_service_title: "Individual consultation",
            content: "Session-linked note",
            created_at: "2027-06-02T13:00:00.000Z",
          }),
        ],
      };
    });

    const res = await callAdminNotes({ method: "GET" });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 701,
          clientId: 501,
          clientName: "Irina Petrova",
          sessionId: null,
          sessionScheduledAt: null,
          sessionServiceTitle: null,
          content: "Private note",
          createdAt: "2027-06-01T09:00:00.000Z",
        },
        {
          id: 702,
          clientId: 502,
          clientName: "Maria Sokolova",
          sessionId: 901,
          sessionScheduledAt: "2027-06-02T12:00:00.000Z",
          sessionServiceTitle: "Individual consultation",
          content: "Session-linked note",
          createdAt: "2027-06-02T13:00:00.000Z",
        },
      ],
    });
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].values).toEqual([]);
  });

  it("returns an empty notes list", async () => {
    const queryLog = createQueryMock(() => ({ rows: [] }));

    const res = await callAdminNotes({ method: "GET" });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ items: [] });
    expect(queryLog).toHaveLength(1);
  });

  it("applies implemented client, session, and search filters to the list query", async () => {
    const queryLog = createQueryMock(() => ({ rows: [] }));

    const res = await callAdminNotes({
      method: "GET",
      query: {
        clientId: "501",
        sessionId: "901",
        search: "  grounding  ",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].values).toEqual([501, 901, "%grounding%"]);
    expect(queryLog[0].sql).toContain("n.client_id = $1");
    expect(queryLog[0].sql).toContain("n.session_id = $2");
    expect(queryLog[0].sql).toContain("ILIKE $3");
  });

  it("rejects invalid list filter ids before querying the database", async () => {
    const handler = await loadNotesHandler();

    for (const query of [{ clientId: "bad" }, { sessionId: "0" }]) {
      const res = createMockResponse();

      await handler(createMockRequest({ method: "GET", query }), res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    }

    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("creates a note without a session and returns the selected note record", async () => {
    const createdRow = noteRow({
      id: "710",
      content: "New private note",
    });
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("INSERT INTO notes")) {
        return { rows: [{ id: "710" }] };
      }

      if (sql.includes("FROM notes n")) {
        return { rows: [createdRow] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminNotes({
      method: "POST",
      query: { action: "create" },
      body: {
        clientId: "501",
        content: "New private note",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "INSERT INTO notes")?.values).toEqual([
      501,
      null,
      "New private note",
    ]);
    expect(findQuery(queryLog, "FROM notes n")?.values).toEqual(["710"]);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 710,
        clientId: 501,
        clientName: "Irina Petrova",
        sessionId: null,
        sessionScheduledAt: null,
        sessionServiceTitle: null,
        content: "New private note",
        createdAt: "2027-06-01T09:00:00.000Z",
      },
    });
  });

  it("creates a note with sessionId and trims content from a string body", async () => {
    const createdRow = noteRow({
      id: "711",
      session_id: "901",
      session_scheduled_at: "2027-06-02T12:00:00.000Z",
      session_service_title: "Individual consultation",
      content: "Trimmed session note",
    });
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("INSERT INTO notes")) {
        return { rows: [{ id: "711" }] };
      }

      if (sql.includes("FROM notes n")) {
        return { rows: [createdRow] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminNotes({
      method: "POST",
      query: { action: "create" },
      body: JSON.stringify({
        clientId: "501",
        sessionId: "901",
        content: "  Trimmed session note  ",
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "INSERT INTO notes")?.values).toEqual([
      501,
      901,
      "Trimmed session note",
    ]);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 711,
        sessionId: 901,
        sessionScheduledAt: "2027-06-02T12:00:00.000Z",
        sessionServiceTitle: "Individual consultation",
        content: "Trimmed session note",
      },
    });
  });

  it.each([
    ["missing clientId", { content: "Private note" }],
    ["invalid clientId", { clientId: "bad", content: "Private note" }],
    ["empty content", { clientId: 501, content: "   " }],
    ["invalid sessionId", { clientId: 501, sessionId: -1, content: "Note" }],
    ["invalid JSON body", "{bad json"],
  ])("rejects invalid create payload: %s", async (_caseName, body) => {
    const res = await callAdminNotes({
      method: "POST",
      query: { action: "create" },
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("updates a note and returns the selected note record", async () => {
    const updatedRow = noteRow({
      id: "701",
      content: "Updated note text",
    });
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("UPDATE notes")) {
        return { rows: [{ id: "701" }] };
      }

      if (sql.includes("FROM notes n")) {
        return { rows: [updatedRow] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminNotes({
      method: "POST",
      query: { action: "update" },
      body: {
        id: "701",
        clientId: "501",
        sessionId: "",
        content: "  Updated note text  ",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "UPDATE notes")?.values).toEqual([
      501,
      null,
      "Updated note text",
      701,
    ]);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 701,
        clientId: 501,
        clientName: "Irina Petrova",
        sessionId: null,
        sessionScheduledAt: null,
        sessionServiceTitle: null,
        content: "Updated note text",
        createdAt: "2027-06-01T09:00:00.000Z",
      },
    });
  });

  it.each([
    ["invalid id", { id: 0, clientId: 501, content: "Note" }],
    ["missing clientId", { id: 701, content: "Note" }],
    ["empty content", { id: 701, clientId: 501, content: " " }],
    ["invalid sessionId", { id: 701, clientId: 501, sessionId: "bad", content: "Note" }],
  ])("rejects invalid update payload: %s", async (_caseName, body) => {
    const res = await callAdminNotes({
      method: "POST",
      query: { action: "update" },
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns not found when update returns no rows", async () => {
    const queryLog = createQueryMock(() => ({ rows: [] }));

    const res = await callAdminNotes({
      method: "POST",
      query: { action: "update" },
      body: {
        id: 999,
        clientId: 501,
        content: "Updated note text",
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].sql).toContain("UPDATE notes");
  });

  it("deletes a note and returns its numeric id", async () => {
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("DELETE FROM notes");
      return { rows: [{ id: "701" }] };
    });

    const res = await callAdminNotes({
      method: "POST",
      query: { action: "delete" },
      body: JSON.stringify({ id: "701" }),
    });

    expect(res.statusCode).toBe(200);
    expect(queryLog[0].values).toEqual([701]);
    expect(res.jsonBody).toEqual({ success: true, id: 701 });
  });

  it.each([
    ["missing id", {}],
    ["invalid id", { id: "bad" }],
    ["invalid JSON body", "{bad json"],
  ])("rejects invalid delete payload: %s", async (_caseName, body) => {
    const res = await callAdminNotes({
      method: "POST",
      query: { action: "delete" },
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns not found when delete returns no rows", async () => {
    const queryLog = createQueryMock(() => ({ rows: [] }));

    const res = await callAdminNotes({
      method: "POST",
      query: { action: "delete" },
      body: { id: 999 },
    });

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(queryLog).toHaveLength(1);
    expect(queryLog[0].sql).toContain("DELETE FROM notes");
  });

  it("handles unsupported methods and unknown POST actions without DB access", async () => {
    const unsupportedMethodRes = await callAdminNotes({
      method: "PUT",
      query: { action: "create" },
      body: {
        clientId: 501,
        content: "Private note",
      },
    });

    expect(unsupportedMethodRes.statusCode).toBe(405);
    expect(unsupportedMethodRes.jsonBody).toEqual({
      error: "Method not allowed",
    });
    expect(requireAdminRequestMock).not.toHaveBeenCalled();

    const unknownActionRes = await callAdminNotes({
      method: "POST",
      query: { action: "unknown" },
      body: {},
    });

    expect(unknownActionRes.statusCode).toBe(405);
    expect(unknownActionRes.jsonBody).toEqual({ error: "Method not allowed" });
    expect(requireAdminRequestMock).toHaveBeenCalledTimes(1);
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("blocks unauthorized GET requests before DB access", async () => {
    requireAdminRequestMock.mockImplementation((_req, res) => {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    });

    const res = await callAdminNotes({ method: "GET" });

    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: "Unauthorized" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });
});
