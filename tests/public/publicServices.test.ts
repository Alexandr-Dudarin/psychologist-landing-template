import { beforeEach, describe, expect, it, vi } from "vitest";

import { siteSettings } from "../../src/data/siteSettings";
import { config } from "../../src/data/config";
import { createMockRequest, createMockResponse } from "../helpers/http";
import type {
  CrmServiceRecord,
  PublicServicePackagePlanRecord,
} from "../../src/types/service";

const { poolQueryMock } = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
}));

vi.mock("../../server/db/pool", () => ({
  pool: {
    query: poolQueryMock,
  },
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
  title: string;
  description: string;
  sessions_count: string | number;
  price: string | number;
};

function serviceRow(overrides: Partial<ServiceRow> = {}): ServiceRow {
  return {
    id: 7,
    title: "Individual consultation",
    description: "Online session",
    price: "5000.50",
    duration_minutes: 60,
    is_active: true,
    sessions_count: "0",
    created_at: "2027-06-01T09:00:00.000Z",
    ...overrides,
  };
}

function packagePlanRow(
  overrides: Partial<PackagePlanRow> = {}
): PackagePlanRow {
  return {
    id: "42",
    service_id: "7",
    service_title: "Individual consultation",
    service_duration_minutes: "60",
    title: "Package of 4 sessions",
    description: "Base package",
    sessions_count: "4",
    price: "18000.25",
    ...overrides,
  };
}

function publicService(
  overrides: Partial<CrmServiceRecord> = {}
): CrmServiceRecord {
  return {
    id: 7,
    title: "Individual consultation",
    description: "Online session",
    price: 5000.5,
    durationMinutes: 60,
    isActive: true,
    sessionsCount: 0,
    createdAt: "2027-06-01T09:00:00.000Z",
    ...overrides,
  };
}

function publicPackagePlan(
  overrides: Partial<PublicServicePackagePlanRecord> = {}
): PublicServicePackagePlanRecord {
  return {
    id: 42,
    serviceId: 7,
    serviceTitle: "Individual consultation",
    serviceDurationMinutes: 60,
    title: "Package of 4 sessions",
    description: "Base package",
    sessionsCount: 4,
    price: 18000.25,
    ...overrides,
  };
}

function createQueryMock(options: {
  services?: ServiceRow[];
  packagePlans?: PackagePlanRow[];
  throwOn?: "services" | "packagePlans";
} = {}) {
  const queryLog: QueryLogEntry[] = [];

  poolQueryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql.includes("FROM service_package_plans")) {
      if (options.throwOn === "packagePlans") {
        throw new Error("package plans db failure");
      }

      return { rows: options.packagePlans ?? [] };
    }

    if (sql.includes("FROM services")) {
      if (options.throwOn === "services") {
        throw new Error("services db failure");
      }

      return { rows: options.services ?? [] };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return { queryLog };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

async function loadPublicServicesHandler() {
  const module = await import("../../api/public/services");
  return module.default;
}

async function callPublicServices(
  overrides: Parameters<typeof createMockRequest>[0]
) {
  const handler = await loadPublicServicesHandler();
  const res = createMockResponse();

  await handler(createMockRequest(overrides), res);

  return res;
}

describe("public services API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    siteSettings.servicePackages.enabled = true;
    siteSettings.servicePackages.publicPricingEnabled = true;
  });

  it("returns active public services and package plans with normalized fields", async () => {
    const { queryLog } = createQueryMock({
      services: [
        serviceRow(),
        serviceRow({
          id: 8,
          title: "Family therapy",
          description: "Joint session",
          price: 6500,
          duration_minutes: 90,
          created_at: "2027-06-02T09:00:00.000Z",
        }),
      ],
      packagePlans: [
        packagePlanRow(),
        packagePlanRow({
          id: 43,
          service_id: 8,
          service_title: "Family therapy",
          service_duration_minutes: 90,
          title: "Family package",
          description: "",
          sessions_count: 6,
          price: 36000,
        }),
      ],
    });

    const res = await callPublicServices({ method: "GET" });

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
          sessionsCount: 0,
          createdAt: "2027-06-01T09:00:00.000Z",
        },
        {
          id: 8,
          title: "Family therapy",
          description: "Joint session",
          price: 6500,
          durationMinutes: 90,
          isActive: true,
          sessionsCount: 0,
          createdAt: "2027-06-02T09:00:00.000Z",
        },
      ],
      packagePlans: [
        {
          id: 42,
          serviceId: 7,
          serviceTitle: "Individual consultation",
          serviceDurationMinutes: 60,
          title: "Package of 4 sessions",
          description: "Base package",
          sessionsCount: 4,
          price: 18000.25,
        },
        {
          id: 43,
          serviceId: 8,
          serviceTitle: "Family therapy",
          serviceDurationMinutes: 90,
          title: "Family package",
          description: "",
          sessionsCount: 6,
          price: 36000,
        },
      ],
    });
    expect(queryLog).toHaveLength(2);
    expect(findQuery(queryLog, "FROM services")?.sql).toContain(
      "WHERE is_active = TRUE"
    );
    expect(findQuery(queryLog, "FROM service_package_plans")?.sql).toContain(
      "WHERE p.is_active = TRUE"
    );
    expect(findQuery(queryLog, "FROM service_package_plans")?.sql).toContain(
      "AND s.is_active = TRUE"
    );
  });

  it("returns empty public services and package plans", async () => {
    const { queryLog } = createQueryMock({
      services: [],
      packagePlans: [],
    });

    const res = await callPublicServices({ method: "GET" });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({
      items: [],
      packagePlans: [],
    });
    expect(queryLog).toHaveLength(2);
  });

  it("does not query package plans when public package pricing is disabled", async () => {
    siteSettings.servicePackages.publicPricingEnabled = false;
    const { queryLog } = createQueryMock({
      services: [serviceRow()],
    });

    const res = await callPublicServices({ method: "GET" });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toMatchObject({
      packagePlans: [],
    });
    expect(queryLog).toHaveLength(1);
    expect(findQuery(queryLog, "FROM service_package_plans")).toBeUndefined();
  });

  it("returns method not allowed for unsupported methods without DB access", async () => {
    createQueryMock();

    const res = await callPublicServices({ method: "POST" });

    expect(res.statusCode).toBe(405);
    expect(res.jsonBody).toEqual({ error: "Method not allowed" });
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when database access fails", async () => {
    createQueryMock({ throwOn: "services" });

    const res = await callPublicServices({ method: "GET" });

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
  });
});

describe("public services client API helper", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads public services data from the current endpoint URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [publicService()],
        packagePlans: [publicPackagePlan()],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getPublicServicesData } = await import(
      "../../src/lib/api/publicServices"
    );

    const result = await getPublicServicesData();

    expect(fetchMock).toHaveBeenCalledWith("/api/public/services");
    expect(result.items).toEqual([publicService()]);
    expect(result.packagePlans).toEqual([publicPackagePlan()]);
  });

  it("returns only service items from getPublicServices", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [publicService()],
          packagePlans: [publicPackagePlan()],
        }),
      })
    );

    const { getPublicServices } = await import("../../src/lib/api/publicServices");

    await expect(getPublicServices()).resolves.toEqual([publicService()]);
  });

  it("returns only package plans from getPublicServicePackagePlans", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [publicService()],
          packagePlans: [publicPackagePlan()],
        }),
      })
    );

    const { getPublicServicePackagePlans } = await import(
      "../../src/lib/api/publicServices"
    );

    await expect(getPublicServicePackagePlans()).resolves.toEqual([
      publicPackagePlan(),
    ]);
  });

  it("throws the response error message for non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Public services unavailable" }),
      })
    );

    const { getPublicServicesData } = await import(
      "../../src/lib/api/publicServices"
    );

    await expect(getPublicServicesData()).rejects.toThrow(
      "Public services unavailable"
    );
  });

  it("throws a fallback error for non-ok malformed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("bad json");
        },
      })
    );

    const { getPublicServicesData } = await import(
      "../../src/lib/api/publicServices"
    );

    await expect(getPublicServicesData()).rejects.toThrow(
      "Не удалось загрузить услуги для публичного прайса."
    );
  });

  it("returns empty arrays for ok malformed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      })
    );

    const { getPublicServicesData } = await import(
      "../../src/lib/api/publicServices"
    );

    await expect(getPublicServicesData()).resolves.toEqual({
      items: [],
      packagePlans: [],
    });
  });

  it("defaults missing packagePlans to an empty array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [publicService()],
        }),
      })
    );

    const { getPublicServicesData } = await import(
      "../../src/lib/api/publicServices"
    );

    await expect(getPublicServicesData()).resolves.toEqual({
      items: [publicService()],
      packagePlans: [],
    });
  });
});

describe("public pricing services source selection", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    siteSettings.pricingSource = "database";
  });

  it("maps config pricing when pricingSource is config without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    siteSettings.pricingSource = "config";

    const { getPublicPricingPackagePlans, getPublicPricingServices } =
      await import("../../src/lib/services/getPublicPricingServices");

    const services = await getPublicPricingServices();
    const packagePlans = await getPublicPricingPackagePlans();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(packagePlans).toEqual([]);
    expect(services).toEqual(
      config.pricing.map((item, index) => ({
        id: `config-${index}`,
        title: item.title,
        description: item.description,
        price: parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0,
      }))
    );
  });

  it("maps database services into the public pricing shape", async () => {
    const activeService = publicService();
    const inactiveService = {
      ...activeService,
      id: 8,
      title: "Inactive service",
      isActive: false,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [activeService, inactiveService],
        packagePlans: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    siteSettings.pricingSource = "database";

    const { getPublicPricingServices } = await import(
      "../../src/lib/services/getPublicPricingServices"
    );

    await expect(getPublicPricingServices()).resolves.toEqual([
      {
        id: "7",
        title: "Individual consultation",
        description: "Online session",
        durationMinutes: 60,
        price: 5000.5,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/api/public/services");
  });

  it("maps database package plans into the public pricing package shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        packagePlans: [publicPackagePlan()],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    siteSettings.pricingSource = "database";

    const { getPublicPricingPackagePlans } = await import(
      "../../src/lib/services/getPublicPricingServices"
    );

    await expect(getPublicPricingPackagePlans()).resolves.toEqual([
      {
        id: "package-42",
        packagePlanId: 42,
        serviceId: 7,
        serviceTitle: "Individual consultation",
        serviceDurationMinutes: 60,
        title: "Package of 4 sessions",
        description: "Base package",
        sessionsCount: 4,
        price: 18000.25,
      },
    ]);
  });

  it("propagates database source API errors without config fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Database source unavailable" }),
      })
    );
    siteSettings.pricingSource = "database";

    const { getPublicPricingServices } = await import(
      "../../src/lib/services/getPublicPricingServices"
    );

    await expect(getPublicPricingServices()).rejects.toThrow(
      "Database source unavailable"
    );
  });
});

describe("public booking/pricing shared package contract", () => {
  it("maps a pricing package plan into the booking service summary shape", async () => {
    const { getServiceFromPackagePlan } = await import(
      "../../src/pages/book/bookingPage.helpers"
    );

    expect(
      getServiceFromPackagePlan({
        id: "package-42",
        packagePlanId: 42,
        serviceId: 7,
        serviceTitle: "Individual consultation",
        serviceDurationMinutes: 60,
        title: "Package of 4 sessions",
        description: "Base package",
        sessionsCount: 4,
        price: 18000.25,
      })
    ).toEqual({
      id: 7,
      title: "Package of 4 sessions",
      description: "Base package",
      price: 18000.25,
      durationMinutes: 60,
    });
  });
});
