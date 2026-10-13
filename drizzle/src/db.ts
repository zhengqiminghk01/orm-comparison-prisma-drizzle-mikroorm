import { drizzle } from "drizzle-orm/node-postgres";
import { withReplicas } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";
import { PRIMARY, REPLICA, POOL } from "../../common/env";

export function createDb() {
  const primary = drizzle(new Pool({ connectionString: PRIMARY + "drizzle", max: POOL }), { schema });
  const replica = drizzle(new Pool({ connectionString: REPLICA + "drizzle", max: POOL }), { schema });
  return withReplicas(primary, [replica]);
}
export type Db = ReturnType<typeof createDb>;
export async function closeDb(db: Db) { await (db.$primary as any).$client.end(); for (const r of (db as any).$replicas ?? []) await r.$client.end(); }
