import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readReplicas } from "@prisma/extension-read-replicas";
import { PRIMARY, REPLICA, POOL } from "../../common/env";

export function createDb() {
  const primary = new PrismaClient({ adapter: new PrismaPg({ connectionString: PRIMARY + "prisma", max: POOL }) });
  const replica = new PrismaClient({ adapter: new PrismaPg({ connectionString: REPLICA + "prisma", max: POOL }) });
  return primary.$extends(readReplicas({ replicas: [replica] }));
}
export type Db = ReturnType<typeof createDb>;
export async function closeDb(db: Db) { await db.$disconnect(); }
