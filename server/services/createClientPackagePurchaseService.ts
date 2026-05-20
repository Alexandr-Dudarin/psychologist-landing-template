import { randomInt } from "node:crypto";
import type { PoolClient } from "pg";

import type { ServicePackagePurchasePayload } from "../payment/packagePurchasePayload.js";
import type { PackagePurchaseNotificationPayload } from "../payment/sendPackagePurchaseNotifications.js";
import { normalizePreferredContactForStorage } from "../../src/lib/preferredContact.js";

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

type ClientPackageRow = {
  id: number | string;
  code: string;
};

type NormalizedPackagePurchasePayload = ServicePackagePurchasePayload & {
  name: string;
};

export type CreateClientPackagePurchaseResult = {
  clientPackage: {
    id: number;
    code: string;
    clientId: number;
    clientName: string;
    packagePlanId: number;
    packageTitle: string;
    serviceId: number;
    serviceTitle: string;
    totalSessions: number;
    remainingSessions: number;
    price: number;
  };
  alreadyExistedClient: boolean;
  notificationPayload: PackagePurchaseNotificationPayload;
};

export class ClientPackagePurchaseError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ClientPackagePurchaseError";
    this.status = status;
    this.code = code;
  }
}

export function isClientPackagePurchaseError(
  error: unknown
): error is ClientPackagePurchaseError {
  return error instanceof ClientPackagePurchaseError;
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

function generatePackageCode(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += alphabet[randomInt(alphabet.length)];
  }

  return result;
}

async function selectPackagePlan(
  db: Pick<PoolClient, "query">,
  packagePlanId: number
): Promise<PackagePlanRow> {
  const result = await db.query<PackagePlanRow>(
    `
      SELECT
        p.id,
        p.title,
        p.description,
        p.sessions_count,
        p.price,
        p.is_active,
        p.service_id,
        s.title AS service_title,
        s.duration_minutes AS service_duration_minutes,
        s.is_active AS service_is_active
      FROM service_package_plans p
      INNER JOIN services s ON s.id = p.service_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [packagePlanId]
  );

  const packagePlan = result.rows[0];

  if (!packagePlan) {
    throw new ClientPackagePurchaseError(
      404,
      "package_plan_not_found",
      "Пакет услуг не найден."
    );
  }

  if (!packagePlan.is_active || !packagePlan.service_is_active) {
    throw new ClientPackagePurchaseError(
      409,
      "package_plan_inactive",
      "Этот пакет услуг сейчас недоступен для покупки."
    );
  }

  return packagePlan;
}

async function findExistingClientByContacts(
  db: Pick<PoolClient, "query">,
  phone: string,
  email: string
): Promise<ClientRow | null> {
  const normalizedPhone = normalizePhoneDigits(phone);
  const normalizedEmail = email.trim().toLowerCase();

  const result = await db.query<ClientRow>(
    `
      SELECT
        id,
        name
      FROM clients
      WHERE
        regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
        OR LOWER(COALESCE(email, '')) = $2
      LIMIT 1
    `,
    [normalizedPhone, normalizedEmail]
  );

  return result.rows[0] ?? null;
}

async function updateClientPreferredContact(
  db: Pick<PoolClient, "query">,
  clientId: number,
  payload: NormalizedPackagePurchasePayload
) {
  const preferredContact = normalizePreferredContactForStorage({
    preferredContactMethod: payload.preferredContactMethod ?? "",
    preferredContactValue: payload.preferredContactValue ?? "",
  });

  if (
    !preferredContact.preferredContactMethod ||
    !preferredContact.preferredContactValue
  ) {
    return;
  }

  await db.query(
    `
      UPDATE clients
      SET
        preferred_contact_method = $2,
        preferred_contact_value = $3
      WHERE id = $1
    `,
    [
      clientId,
      preferredContact.preferredContactMethod,
      preferredContact.preferredContactValue,
    ]
  );
}

async function ensureClient(
  db: Pick<PoolClient, "query">,
  payload: NormalizedPackagePurchasePayload
) {
  const preferredContact = normalizePreferredContactForStorage({
    preferredContactMethod: payload.preferredContactMethod ?? "",
    preferredContactValue: payload.preferredContactValue ?? "",
  });

  const existingClient = await findExistingClientByContacts(
    db,
    payload.phone,
    payload.email
  );

  if (existingClient) {
    await updateClientPreferredContact(db, Number(existingClient.id), payload);

    return {
      clientId: Number(existingClient.id),
      clientName: existingClient.name,
      alreadyExisted: true,
    };
  }

  const created = await db.query<ClientRow>(
    `
      INSERT INTO clients (
        name,
        phone,
        email,
        preferred_contact_method,
        preferred_contact_value,
        source,
        status,
        first_request_id
      )
      VALUES ($1, $2, $3, $4, $5, 'website', 'active', NULL)
      RETURNING
        id,
        name
    `,
    [
      payload.name,
      payload.phone,
      payload.email,
      preferredContact.preferredContactMethod,
      preferredContact.preferredContactValue,
    ]
  );

  return {
    clientId: Number(created.rows[0].id),
    clientName: created.rows[0].name,
    alreadyExisted: false,
  };
}

async function insertClientPackageWithUniqueCode(
  db: Pick<PoolClient, "query">,
  params: {
    clientId: number;
    packagePlanId: number;
  }
): Promise<ClientPackageRow> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generatePackageCode();

    try {
      const result = await db.query<ClientPackageRow>(
        `
          INSERT INTO client_service_packages (
            client_id,
            package_plan_id,
            code,
            status
          )
          VALUES ($1, $2, $3, 'active')
          RETURNING
            id,
            code
        `,
        [params.clientId, params.packagePlanId, code]
      );

      return result.rows[0];
    } catch (error) {
      const pgError = error as { code?: string };

      if (pgError.code === "23505") {
        continue;
      }

      throw error;
    }
  }

  throw new ClientPackagePurchaseError(
    500,
    "package_code_generation_failed",
    "Не удалось сгенерировать уникальный код пакета."
  );
}

export async function createClientPackagePurchaseService(
  client: PoolClient,
  payload: ServicePackagePurchasePayload
): Promise<CreateClientPackagePurchaseResult> {
  const normalizedPayload: NormalizedPackagePurchasePayload = {
    ...payload,
    name: buildFullName(payload.firstName, payload.lastName),
  };

  const packagePlan = await selectPackagePlan(client, payload.packagePlanId);
  const clientResult = await ensureClient(client, normalizedPayload);

  const clientPackage = await insertClientPackageWithUniqueCode(client, {
    clientId: clientResult.clientId,
    packagePlanId: Number(packagePlan.id),
  });

  const totalSessions = Number(packagePlan.sessions_count);
  const price = Number(packagePlan.price);

  const result: CreateClientPackagePurchaseResult = {
    clientPackage: {
      id: Number(clientPackage.id),
      code: clientPackage.code,
      clientId: clientResult.clientId,
      clientName: clientResult.clientName,
      packagePlanId: Number(packagePlan.id),
      packageTitle: packagePlan.title,
      serviceId: Number(packagePlan.service_id),
      serviceTitle: packagePlan.service_title,
      totalSessions,
      remainingSessions: totalSessions,
      price,
    },
    alreadyExistedClient: clientResult.alreadyExisted,
    notificationPayload: {
      clientName: clientResult.clientName,
      clientPhone: normalizedPayload.phone,
      clientEmail: normalizedPayload.email,
      packageTitle: packagePlan.title,
      packageCode: clientPackage.code,
      serviceTitle: packagePlan.service_title,
      totalSessions,
      remainingSessions: totalSessions,
      price,
    },
  };

  return result;
}