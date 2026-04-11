/// <reference types="node" />

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPg = globalThis as typeof globalThis & {
  __pgPool?: Pool;
};

export const pool =
  globalForPg.__pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.__pgPool = pool;
}