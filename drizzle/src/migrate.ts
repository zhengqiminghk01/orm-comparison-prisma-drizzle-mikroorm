import { drizzle } from "drizzle-orm/node-postgres"; import { migrate } from "drizzle-orm/node-postgres/migrator";
const db = drizzle(process.env.DATABASE_URL!);
migrate(db, { migrationsFolder: "./drizzle" }).then(()=>{console.log("ok");process.exit(0)}).catch(e=>{console.log("ERROR:", e.cause?.message ?? e.message);process.exit(1)});
