import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "./schema/index";

let _db: ReturnType<typeof createDb> | null = null;

function createDb(databaseUrl?: string) {
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  return drizzle({ client: sql, schema });
}

/**
 * Get or create a Drizzle database instance.
 * Pass a custom URL for Neon branch isolation (agent workflows).
 */
export function getDb(databaseUrl?: string) {
  if (databaseUrl) {
    return createDb(databaseUrl);
  }
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
