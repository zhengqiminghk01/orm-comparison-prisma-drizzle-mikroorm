import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { entities } from "./src/entities";
export default defineConfig({
  clientUrl: process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5432/b_mikro",
  entities,
  extensions: [Migrator],
  migrations: { path: "./migrations", pathTs: "./migrations" },
});
