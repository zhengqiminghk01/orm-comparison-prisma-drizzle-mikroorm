import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DbModule, DB } from "./db.module";

import * as ops from "./ops";
@Module({ imports: [DbModule] }) class AppModule {}
(async () => {
  const t0 = performance.now();
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const db: any = app.get(DB);
  const r = await ops.page(db, "00000000-0000-7000-9000-000000000000");
  console.log(JSON.stringify({ orm: "prisma", nestBootPlusFirstPageMs: +(performance.now() - t0).toFixed(1), rows: r.items.length }));
  await app.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
