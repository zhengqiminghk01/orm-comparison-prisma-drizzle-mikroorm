import { MikroORM, defineConfig } from "@mikro-orm/postgresql";
import { entities } from "./entities";
import { PRIMARY, REPLICA, POOL } from "../../common/env";

export const ormConfig = defineConfig({
  clientUrl: PRIMARY + "mikro",
  replicas: [{ name: "replica", clientUrl: REPLICA + "mikro" }],
  entities,
  pool: { max: POOL },
  // preferReadReplicas defaults to true: em.find/count go to a replica, flush/transactions go to primary
});
export async function createDb() { return MikroORM.init(ormConfig); }
export type Db = MikroORM;
export async function closeDb(db: Db) { await db.close(); }
