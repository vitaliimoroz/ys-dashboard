import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set to connect to the database");
  }

  return drizzle(neon(databaseUrl), { schema });
}

export type Database = ReturnType<typeof createDb>;