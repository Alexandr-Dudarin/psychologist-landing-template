import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

import type { ServicePackagePurchasePayload } from "../server/payment/packagePurchasePayload";
import {
  ClientPackagePurchaseError,
  createClientPackagePurchaseService,
} from "../server/services/createClientPackagePurchaseService";

type QueryLogEntry = {
  sql: string;
  values?: unknown[];
};

type PackagePlanRow = {
  id: number | string;
  title: string;
  description: string;
  sessions_count: number | string;
  price: number | string;
  is_active: boolean;
  service_id: number | string;
  service_title: string;
  service_duration_minutes: number | string;
  service_is_active: boolean;
};

type ClientRow = {
  id: number | string;
  name: string;
};

type MockDbOptions = {
  packagePlan?: PackagePlanRow | null;
  existingClient?: ClientRow | null;
  createdClient?: ClientRow;
  packageInsertResults?: Array<{ id: number | string; code: string }>;
  failFirstPackageInsertWithUniqueViolation?: boolean;
};

const activePackagePlan: PackagePlanRow = {
  id: 42,
  title: "Пакет из 4 консультаций",
  description: "Базовый пакет",
  sessions_count: 4,
  price: 14000,
  is_active: true,
  service_id: 7,
  service_title: "Индивидуальная консультация",
  service_duration_minutes: 60,
  service_is_active: true,
};

function createPurchasePayload(
  overrides: Partial<ServicePackagePurchasePayload> = {}
): ServicePackagePurchasePayload {
  return {
    packagePlanId: 42,
    firstName: "  Ирина  ",
    lastName: "  Петрова  ",
    phone: "+7 (999) 123-45-67",
    email: "irina@example.com",
    preferredContactMethod: "whatsapp",
    preferredContactValue: " +7 999 123-45-67 ",
    consent: true,
    ...overrides,
  };
}

function createMockDb(options: MockDbOptions = {}) {
  const queryLog: QueryLogEntry[] = [];
  let packageInsertAttempts = 0;

  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    queryLog.push({ sql, values });

    if (sql.includes("FROM service_package_plans")) {
      return {
        rows:
          options.packagePlan === null
            ? []
            : [options.packagePlan ?? activePackagePlan],
      };
    }

    if (sql.includes("FROM clients")) {
      return {
        rows: options.existingClient ? [options.existingClient] : [],
      };
    }

    if (sql.includes("INSERT INTO clients")) {
      return {
        rows: [
          options.createdClient ?? {
            id: 501,
            name: "Ирина Петрова",
          },
        ],
      };
    }

    if (sql.includes("UPDATE clients")) {
      return {
        rows: [],
      };
    }

    if (sql.includes("INSERT INTO client_service_packages")) {
      packageInsertAttempts += 1;

      if (
        options.failFirstPackageInsertWithUniqueViolation &&
        packageInsertAttempts === 1
      ) {
        const error = new Error("duplicate package code") as Error & {
          code: string;
        };
        error.code = "23505";
        throw error;
      }

      return {
        rows: [
          options.packageInsertResults?.[
            Math.min(
              packageInsertAttempts - 1,
              (options.packageInsertResults?.length ?? 1) - 1
            )
          ] ?? {
            id: 901,
            code: "PKGTEST001",
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  });

  return {
    db: { query } as unknown as PoolClient,
    query,
    queryLog,
  };
}

function findQuery(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.find((entry) => entry.sql.includes(fragment));
}

function findQueries(queryLog: QueryLogEntry[], fragment: string) {
  return queryLog.filter((entry) => entry.sql.includes(fragment));
}

describe("createClientPackagePurchaseService", () => {
  it("создает пакет для нового клиента", async () => {
    const { db, queryLog } = createMockDb({
      createdClient: {
        id: "501",
        name: "Ирина Петрова",
      },
      packageInsertResults: [
        {
          id: "901",
          code: "SVS32PNCRH",
        },
      ],
    });

    const result = await createClientPackagePurchaseService(
      db,
      createPurchasePayload()
    );

    expect(result).toEqual({
      clientPackage: {
        id: 901,
        code: "SVS32PNCRH",
        clientId: 501,
        clientName: "Ирина Петрова",
        packagePlanId: 42,
        packageTitle: "Пакет из 4 консультаций",
        serviceId: 7,
        serviceTitle: "Индивидуальная консультация",
        totalSessions: 4,
        remainingSessions: 4,
        price: 14000,
      },
      alreadyExistedClient: false,
      notificationPayload: {
        clientName: "Ирина Петрова",
        clientPhone: "+7 (999) 123-45-67",
        clientEmail: "irina@example.com",
        preferredContact: "WhatsApp: +7 999 123-45-67",
        packageTitle: "Пакет из 4 консультаций",
        packageCode: "SVS32PNCRH",
        serviceTitle: "Индивидуальная консультация",
        totalSessions: 4,
        remainingSessions: 4,
        price: 14000,
      },
    });

    expect(findQuery(queryLog, "FROM service_package_plans")?.values).toEqual([
      42,
    ]);
    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      "79991234567",
      "irina@example.com",
    ]);
    expect(findQuery(queryLog, "INSERT INTO clients")?.values).toEqual([
      "Ирина Петрова",
      "+7 (999) 123-45-67",
      "irina@example.com",
      "whatsapp",
      "+7 999 123-45-67",
    ]);
    expect(
      findQuery(queryLog, "INSERT INTO client_service_packages")?.values
    ).toEqual([501, 42, expect.any(String)]);
  });

  it("покупает пакет для существующего клиента и обновляет preferred contact", async () => {
    const { db, queryLog } = createMockDb({
      existingClient: {
        id: "77",
        name: "Существующий Клиент",
      },
      packageInsertResults: [
        {
          id: 902,
          code: "PKGEXIST01",
        },
      ],
    });

    const result = await createClientPackagePurchaseService(
      db,
      createPurchasePayload({
        phone: "+7 999 000-00-00",
        email: " Existing@Example.COM ",
        preferredContactMethod: "telegram",
        preferredContactValue: " @existing_test ",
      })
    );

    expect(result.clientPackage).toMatchObject({
      id: 902,
      code: "PKGEXIST01",
      clientId: 77,
      clientName: "Существующий Клиент",
      packagePlanId: 42,
    });
    expect(result.alreadyExistedClient).toBe(true);
    expect(result.notificationPayload).toMatchObject({
      clientName: "Существующий Клиент",
      clientPhone: "+7 999 000-00-00",
      clientEmail: " Existing@Example.COM ",
      preferredContact: "Telegram: @existing_test",
      packageCode: "PKGEXIST01",
    });

    expect(findQuery(queryLog, "FROM clients")?.values).toEqual([
      "79990000000",
      "existing@example.com",
    ]);
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
    expect(findQuery(queryLog, "UPDATE clients")?.values).toEqual([
      77,
      "telegram",
      "@existing_test",
    ]);
    expect(
      findQuery(queryLog, "INSERT INTO client_service_packages")?.values
    ).toEqual([77, 42, expect.any(String)]);
  });

  it("не обновляет preferred contact существующего клиента, если method/value пустые", async () => {
    const { db, queryLog } = createMockDb({
      existingClient: {
        id: 88,
        name: "Клиент Без Контакта",
      },
      packageInsertResults: [
        {
          id: 903,
          code: "PKGEMPTY01",
        },
      ],
    });

    const result = await createClientPackagePurchaseService(
      db,
      createPurchasePayload({
        preferredContactMethod: "",
        preferredContactValue: "   ",
      })
    );

    expect(result.alreadyExistedClient).toBe(true);
    expect(result.clientPackage).toMatchObject({
      id: 903,
      clientId: 88,
      code: "PKGEMPTY01",
    });
    expect(result.notificationPayload.preferredContact).toBe("-");
    expect(findQuery(queryLog, "UPDATE clients")).toBeUndefined();
    expect(findQuery(queryLog, "INSERT INTO clients")).toBeUndefined();
    expect(
      findQuery(queryLog, "INSERT INTO client_service_packages")?.values
    ).toEqual([88, 42, expect.any(String)]);
  });

  it("бросает ClientPackagePurchaseError, если package plan не найден", async () => {
    const { db } = createMockDb({
      packagePlan: null,
    });

    await expect(
      createClientPackagePurchaseService(db, createPurchasePayload())
    ).rejects.toMatchObject({
      name: "ClientPackagePurchaseError",
      status: 404,
      code: "package_plan_not_found",
    });
  });

  it.each([
    {
      caseName: "package plan неактивен",
      packagePlan: {
        ...activePackagePlan,
        is_active: false,
      },
    },
    {
      caseName: "связанная service неактивна",
      packagePlan: {
        ...activePackagePlan,
        service_is_active: false,
      },
    },
  ])(
    "бросает ClientPackagePurchaseError, если $caseName",
    async ({ packagePlan }) => {
      const { db } = createMockDb({
        packagePlan,
      });

      try {
        await createClientPackagePurchaseService(db, createPurchasePayload());
        throw new Error("Expected service to reject");
      } catch (error) {
        expect(error).toBeInstanceOf(ClientPackagePurchaseError);
        expect(error).toMatchObject({
          status: 409,
          code: "package_plan_inactive",
        });
      }
    }
  );

  it("повторяет генерацию кода, если вставка пакета упала с unique violation", async () => {
    const { db, queryLog } = createMockDb({
      failFirstPackageInsertWithUniqueViolation: true,
      packageInsertResults: [
        {
          id: 904,
          code: "PKGRETRY01",
        },
      ],
    });

    const result = await createClientPackagePurchaseService(
      db,
      createPurchasePayload()
    );

    const packageInserts = findQueries(
      queryLog,
      "INSERT INTO client_service_packages"
    );

    expect(packageInserts).toHaveLength(2);
    expect(packageInserts[0]?.values).toEqual([501, 42, expect.any(String)]);
    expect(packageInserts[1]?.values).toEqual([501, 42, expect.any(String)]);
    expect(result.clientPackage).toMatchObject({
      id: 904,
      code: "PKGRETRY01",
      clientId: 501,
    });
    expect(result.notificationPayload.packageCode).toBe("PKGRETRY01");
  });
});
