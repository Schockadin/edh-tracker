import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the postgres client across hot reloads / serverless invocations to
// avoid exhausting connections. `max: 1` keeps us friendly to serverless
// (Netlify functions) and Railway's connection limits; bump it for a
// long-lived server.
const globalForDb = globalThis as unknown as {
  __edhClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__edhClient ??
  postgres(connectionString, {
    max: 1,
    prepare: false, // safe with connection poolers (e.g. PgBouncer/Railway)
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__edhClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
