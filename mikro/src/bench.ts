const t0 = Number(process.hrtime.bigint()) / 1e6;
import { createDb, closeDb } from "./db";
import * as ops from "./ops";
import { bench } from "../../common/bench";
(async () => { const db: any = await createDb(); await ops.page(db, "00000000-0000-7000-9000-000000000000"); await bench("mikro", Number(process.argv[2] ?? 1), t0, db, ops, () => closeDb(db)); })().catch((e) => { console.error(e); process.exit(1); });
