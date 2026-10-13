import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DbModule } from "./db.module";
import { MikroORM } from "@mikro-orm/postgresql";
import * as ops from "./ops";
@Module({ imports: [DbModule] }) class AppModule {}
(async () => {
  const t0 = performance.now();
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error"] });
  const db: any = app.get(MikroORM);
  const r = await ops.page(db, "00000000-0000-7000-9000-000000000000");
  console.log(JSON.stringify({ orm: "mikro", nestBootPlusFirstPageMs: +(performance.now() - t0).toFixed(1), rows: r.items.length }));
  await app.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
