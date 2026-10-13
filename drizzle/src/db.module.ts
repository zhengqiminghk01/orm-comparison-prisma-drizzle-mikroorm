import { Global, Module, OnApplicationShutdown, Inject } from "@nestjs/common";
import { createDb, type Db } from "./db";
export const DB = Symbol("DB");
@Global()
@Module({ providers: [{ provide: DB, useFactory: createDb }], exports: [DB] })
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB) private readonly db: Db) {}
  async onApplicationShutdown() { await (this.db.$primary.$client as any).end(); await ((this.db as any).$replicas?.[0]?.$client ?? { end: async () => {} }).end(); }
}
