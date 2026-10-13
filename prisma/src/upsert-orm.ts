import { createDb, closeDb } from "./db";
import * as ops from "./ops";
(async () => {
  const db = createDb(); const out: number[] = [];
  for (let i = 0; i < 5; i++) { const rows = Array.from({ length: 1000 }, (_, k) => ({ unionId: String(95000 + i * 500 + k), nickname: `o${i}_${k}`, avatarUrl: null })); const s = performance.now(); await ops.upsertAccountsOrm(db, rows); out.push(+(performance.now() - s).toFixed(1)); }
  console.log(JSON.stringify({ orm: "prisma", method: "$transaction([...1000 x upsert])", msPerBatch1000: out }));
  await closeDb(db);
})();
