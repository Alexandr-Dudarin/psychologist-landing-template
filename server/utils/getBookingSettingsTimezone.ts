/// <reference types="node" />

import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import { resolveBookingTimezone } from "../../src/lib/booking/bookingTimezones.js";

type Queryable = Pick<PoolClient, "query">;

type BookingTimezoneRow = {
  timezone: string | null;
};

export function mapBookingSettingsTimezone(
  row: BookingTimezoneRow | undefined
): string {
  return resolveBookingTimezone(row?.timezone);
}

export async function getBookingSettingsTimezone(
  db: Queryable = pool
): Promise<string> {
  const result = await db.query<BookingTimezoneRow>(`
    SELECT timezone
    FROM booking_settings
    WHERE id = 1
    LIMIT 1
  `);

  return mapBookingSettingsTimezone(result.rows[0]);
}