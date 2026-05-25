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

type ServiceRow = {
  id: number;
  title: string;
  description: string;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  sessions_count: string | number;
  created_at: string;
};

type PackagePlanRow = {
  id: string | number;
  service_id: string | number;
  service_title: string;
  service_duration_minutes: string | number;
  service_is_active: boolean;
  title: string;
  description: string;
  sessions_count: string | number;
  price: string | number;
  is_active: boolean;
  client_packages_count: string | number;
  created_at: string;
};

const serviceRow: ServiceRow = {
  id: 7,
  title: "Individual consultation",
  description: "Online session",
  price: "5000.50",
  duration_minutes: 60,
  is_active: true,
  sessions_count: "3",
  created_at: "2026-05-20T10:00:00.000Z",
};

const packagePlanRow: PackagePlanRow = {
  id: "42",
  service_id: "7",
  service_title: "Individual consultation",
  service_duration_minutes: "60",
  service_is_active: true,
  title: "Package of 4 sessions",
  description: "Base package",
  sessions_count: "4",
  price: "18000.25",
  is_active: true,
  client_packages_count: "2",
  created_at: "2026-05-21T10:00:00.000Z",
};

function mockAdminAccess() {
  requireAdminRequestMock.mockReturnValue(true);
}

async function loadHandler() {
  const module = await import("../../api/admin/services");
  return module.default;
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
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

async function callAdminServices(
  overrides: Parameters<typeof createMockRequest>[0]
) {
  const handler = await loadHandler();
  const res = createMockResponse();

  await handler(createMockRequest(overrides), res);

  return res;
}

describe("admin services API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminAccess();
  });

  it("returns services list with normalized numeric fields", async () => {
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("FROM services");
      expect(sql).toContain("ORDER BY is_active DESC");

      return {
        rows: [
          serviceRow,
          {
            ...serviceRow,
            id: 8,
            title: "Archived service",
            price: 0,
            duration_minutes: 45,
            is_active: false,
            sessions_count: 0,
          },
        ],
      };
    });

    const res = await callAdminServices({
      method: "GET",
      query: { activity: "active", search: "consult" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 7,
          title: "Individual consultation",
          description: "Online session",
          price: 5000.5,
          durationMinutes: 60,
          isActive: true,
          sessionsCount: 3,
          createdAt: "2026-05-20T10:00:00.000Z",
        },
        {
          id: 8,
          title: "Archived service",
          description: "Online session",
          price: 0,
          durationMinutes: 45,
          isActive: false,
          sessionsCount: 0,
          createdAt: "2026-05-20T10:00:00.000Z",
        },
      ],
    });
    expect(queryLog[0]?.values).toEqual([true, "%consult%"]);
  });

  it("creates a service and passes normalized fields to SQL params", async () => {
    const createdRow: ServiceRow = {
      ...serviceRow,
      id: 11,
      title: "Family therapy",
      description: "Joint session",
      price: "6500",
      duration_minutes: 90,
      is_active: false,
      sessions_count: "0",
    };
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("INSERT INTO services");
      expect(sql).toContain("duration_minutes");
      expect(sql).toContain("is_active");

      return { rows: [createdRow] };
    });

    const res = await callAdminServices({
      method: "POST",
      query: { action: "create" },
      body: {
        title: "  Family therapy  ",
        description: "  Joint session  ",
        price: "6500",
        durationMinutes: "90",
        isActive: false,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "INSERT INTO services")?.values).toEqual([
      "Family therapy",
      "Joint session",
      6500,
      90,
      false,
    ]);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 11,
        title: "Family therapy",
        description: "Joint session",
        price: 6500,
        durationMinutes: 90,
        isActive: false,
        sessionsCount: 0,
        createdAt: "2026-05-20T10:00:00.000Z",
      },
    });
  });

  it("updates a service and returns the current response shape", async () => {
    const updatedRow: ServiceRow = {
      ...serviceRow,
      id: 7,
      title: "Updated consultation",
      description: "Updated description",
      price: "7000",
      duration_minutes: 75,
      is_active: false,
      sessions_count: "5",
    };
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("UPDATE services");
      expect(sql).toContain("WHERE id = $6");

      return { rows: [updatedRow] };
    });

    const res = await callAdminServices({
      method: "POST",
      query: { action: "update" },
      body: {
        id: "7",
        title: " Updated consultation ",
        description: " Updated description ",
        price: "7000",
        durationMinutes: "75",
        isActive: false,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "UPDATE services")?.values).toEqual([
      "Updated consultation",
      "Updated description",
      7000,
      75,
      false,
      7,
    ]);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 7,
        title: "Updated consultation",
        description: "Updated description",
        price: 7000,
        durationMinutes: 75,
        isActive: false,
        sessionsCount: 5,
        createdAt: "2026-05-20T10:00:00.000Z",
      },
    });
  });

  it("deletes a service when it has no sessions or package plans", async () => {
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("FROM sessions")) {
        return { rows: [{ count: "0" }] };
      }

      if (sql.includes("FROM service_package_plans")) {
        return { rows: [{ count: "0" }] };
      }

      if (sql.includes("DELETE FROM services")) {
        return { rows: [{ id: 7 }] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminServices({
      method: "POST",
      query: { action: "delete" },
      body: { id: "7" },
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "FROM sessions")?.values).toEqual([7]);
    expect(findQuery(queryLog, "FROM service_package_plans")?.values).toEqual([
      7,
    ]);
    expect(findQuery(queryLog, "DELETE FROM services")?.values).toEqual([7]);
    expect(res.jsonBody).toEqual({ success: true, id: 7 });
  });

  it.each([
    ["empty title", "create", { title: " ", price: 5000, durationMinutes: 60 }],
    [
      "negative price",
      "create",
      { title: "Consultation", price: -1, durationMinutes: 60 },
    ],
    [
      "non-numeric price",
      "create",
      { title: "Consultation", price: "free", durationMinutes: 60 },
    ],
    [
      "zero duration",
      "create",
      { title: "Consultation", price: 5000, durationMinutes: 0 },
    ],
    [
      "non-integer duration",
      "create",
      { title: "Consultation", price: 5000, durationMinutes: 60.5 },
    ],
    [
      "missing update id",
      "update",
      { title: "Consultation", price: 5000, durationMinutes: 60 },
    ],
  ])("rejects invalid service payload: %s", async (_caseName, action, body) => {
    const res = await callAdminServices({
      method: "POST",
      query: { action },
      body,
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns package plans list with normalized numeric fields", async () => {
    const queryLog = createQueryMock((sql) => {
      expect(sql).toContain("FROM service_package_plans");
      expect(sql).toContain("INNER JOIN services");

      return {
        rows: [
          packagePlanRow,
          {
            ...packagePlanRow,
            id: 43,
            service_id: 8,
            sessions_count: 8,
            price: 32000,
            is_active: false,
            client_packages_count: 0,
          },
        ],
      };
    });

    const res = await callAdminServices({
      method: "GET",
      query: { action: "list-package-plans" },
    });

    expect(res.statusCode).toBe(200);
    expect(findQuery(queryLog, "FROM service_package_plans")).toBeDefined();
    expect(res.jsonBody).toEqual({
      items: [
        {
          id: 42,
          serviceId: 7,
          serviceTitle: "Individual consultation",
          serviceDurationMinutes: 60,
          serviceIsActive: true,
          title: "Package of 4 sessions",
          description: "Base package",
          sessionsCount: 4,
          price: 18000.25,
          isActive: true,
          clientPackagesCount: 2,
          createdAt: "2026-05-21T10:00:00.000Z",
        },
        {
          id: 43,
          serviceId: 8,
          serviceTitle: "Individual consultation",
          serviceDurationMinutes: 60,
          serviceIsActive: true,
          title: "Package of 4 sessions",
          description: "Base package",
          sessionsCount: 8,
          price: 32000,
          isActive: false,
          clientPackagesCount: 0,
          createdAt: "2026-05-21T10:00:00.000Z",
        },
      ],
    });
  });

  it("creates a package plan and returns the joined package plan record", async () => {
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("INSERT INTO service_package_plans")) {
        return { rows: [{ id: 42 }] };
      }

      if (sql.includes("FROM service_package_plans")) {
        return { rows: [packagePlanRow] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminServices({
      method: "POST",
      query: { action: "create-package-plan" },
      body: {
        serviceId: "7",
        title: " Package of 4 sessions ",
        description: " Base package ",
        sessionsCount: "4",
        price: "18000.25",
        isActive: true,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(
      findQuery(queryLog, "INSERT INTO service_package_plans")?.values
    ).toEqual([7, "Package of 4 sessions", "Base package", 4, 18000.25, true]);
    expect(findQuery(queryLog, "FROM service_package_plans")?.values).toEqual([
      42,
    ]);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 42,
        serviceId: 7,
        serviceTitle: "Individual consultation",
        serviceDurationMinutes: 60,
        serviceIsActive: true,
        title: "Package of 4 sessions",
        description: "Base package",
        sessionsCount: 4,
        price: 18000.25,
        isActive: true,
        clientPackagesCount: 2,
        createdAt: "2026-05-21T10:00:00.000Z",
      },
    });
  });

  it("updates a package plan and returns the joined package plan record", async () => {
    const updatedRow: PackagePlanRow = {
      ...packagePlanRow,
      id: "42",
      service_id: "8",
      service_title: "Family therapy",
      title: "Updated package",
      description: "Updated package description",
      sessions_count: "6",
      price: "25000",
      is_active: false,
    };
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("UPDATE service_package_plans")) {
        return { rows: [{ id: 42 }] };
      }

      if (sql.includes("FROM service_package_plans")) {
        return { rows: [updatedRow] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminServices({
      method: "POST",
      query: { action: "update-package-plan" },
      body: {
        id: "42",
        serviceId: "8",
        title: " Updated package ",
        description: " Updated package description ",
        sessionsCount: "6",
        price: "25000",
        isActive: false,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(
      findQuery(queryLog, "UPDATE service_package_plans")?.values
    ).toEqual([
      8,
      "Updated package",
      "Updated package description",
      6,
      25000,
      false,
      42,
    ]);
    expect(res.jsonBody).toEqual({
      success: true,
      item: {
        id: 42,
        serviceId: 8,
        serviceTitle: "Family therapy",
        serviceDurationMinutes: 60,
        serviceIsActive: true,
        title: "Updated package",
        description: "Updated package description",
        sessionsCount: 6,
        price: 25000,
        isActive: false,
        clientPackagesCount: 2,
        createdAt: "2026-05-21T10:00:00.000Z",
      },
    });
  });

  it("hides a package plan by setting is_active to false", async () => {
    const hiddenRow: PackagePlanRow = {
      ...packagePlanRow,
      is_active: false,
    };
    const queryLog = createQueryMock((sql) => {
      if (sql.includes("UPDATE service_package_plans")) {
        expect(sql).toContain("is_active = FALSE");
        return { rows: [{ id: 42 }] };
      }

      if (sql.includes("FROM service_package_plans")) {
        return { rows: [hiddenRow] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    const res = await callAdminServices({
      method: "POST",
      query: { action: "hide-package-plan" },
      body: { id: "42" },
    });

    expect(res.statusCode).toBe(200);
    expect(
      findQuery(queryLog, "UPDATE service_package_plans")?.values
    ).toEqual([42]);
    expect(res.jsonBody).toMatchObject({
      success: true,
      item: {
        id: 42,
        isActive: false,
      },
    });
  });

  it.each([
    [
      "empty title",
      "create-package-plan",
      { serviceId: 7, title: " ", sessionsCount: 4, price: 18000 },
    ],
    [
      "missing serviceId",
      "create-package-plan",
      { title: "Package", sessionsCount: 4, price: 18000 },
    ],
    [
      "invalid serviceId",
      "create-package-plan",
      { serviceId: 0, title: "Package", sessionsCount: 4, price: 18000 },
    ],
    [
      "zero sessions count",
      "create-package-plan",
      { serviceId: 7, title: "Package", sessionsCount: 0, price: 18000 },
    ],
    [
      "negative price",
      "create-package-plan",
      { serviceId: 7, title: "Package", sessionsCount: 4, price: -1 },
    ],
    [
      "missing update id",
      "update-package-plan",
      { serviceId: 7, title: "Package", sessionsCount: 4, price: 18000 },
    ],
  ])(
    "rejects invalid package plan payload: %s",
    async (_caseName, action, body) => {
      const res = await callAdminServices({
        method: "POST",
        query: { action },
        body,
      });

      expect(res.statusCode).toBe(400);
      expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
      expect(poolQueryMock).not.toHaveBeenCalled();
    }
  );

  it("returns 400 for invalid services activity filter", async () => {
    const res = await callAdminServices({
      method: "GET",
      query: { activity: "archived" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toMatchObject({ error: "Invalid activity filter" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns 405 for unsupported methods and unknown POST actions", async () => {
    const unsupportedMethodRes = await callAdminServices({
      method: "PUT",
      query: { action: "create" },
      body: {
        title: "Consultation",
        price: 5000,
        durationMinutes: 60,
      },
    });

    expect(unsupportedMethodRes.statusCode).toBe(405);
    expect(unsupportedMethodRes.jsonBody).toEqual({
      error: "Method not allowed",
    });
    expect(requireAdminRequestMock).not.toHaveBeenCalled();

    const unknownActionRes = await callAdminServices({
      method: "POST",
      query: { action: "unknown" },
      body: {},
    });

    expect(unknownActionRes.statusCode).toBe(405);
    expect(unknownActionRes.jsonBody).toEqual({ error: "Method not allowed" });
    expect(requireAdminRequestMock).toHaveBeenCalledTimes(1);
    expect(poolQueryMock).not.toHaveBeenCalled();
  });
});
