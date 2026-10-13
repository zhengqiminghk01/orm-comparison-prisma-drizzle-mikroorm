import { createDb, closeDb } from "./db";
import * as ops from "./ops";
import { routing } from "../../common/routing";
(async () => { const db: any = await createDb(); console.log("init"); await routing("x", db, ops, () => closeDb(db)); })().catch((e) => { console.error(e); process.exit(1); });
