import { readFileSync, writeFileSync } from "node:fs";
import { HOT } from "./env";
const cursors: string[] = JSON.parse(readFileSync("../common/cursors.json", "utf8")).map((c: [string, string]) => Buffer.from(JSON.stringify(c)).toString("base64url"));
const INS_PARENT = "00000000-0000-7000-9000-000000000050";
const now = () => Number(process.hrtime.bigint()) / 1e6;
function pct(a: number[], p: number) { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; }
function summary(lat: number[], totalMs: number) { return { n: lat.length, p50: +pct(lat, 50).toFixed(3), p95: +pct(lat, 95).toFixed(3), p99: +pct(lat, 99).toFixed(3), mean: +(lat.reduce((a, b) => a + b, 0) / lat.length).toFixed(3), opsPerSec: +((lat.length / totalMs) * 1000).toFixed(1) }; }
async function timed(n: number, fn: (i: number) => Promise<any>) { const lat: number[] = []; const t0 = now(); for (let i = 0; i < n; i++) { const s = now(); await fn(i); lat.push(now() - s); } return summary(lat, now() - t0); }
async function concurrent(n: number, workers: number, fn: (i: number) => Promise<any>) {
  const lat: number[] = []; let next = 0; const t0 = now();
  await Promise.all(Array.from({ length: workers }, async () => { while (true) { const i = next++; if (i >= n) return; const s = now(); await fn(i); lat.push(now() - s); } }));
  return summary(lat, now() - t0);
}
export async function bench(name: string, round: number, t0: number, db: any, ops: any, close: () => Promise<void>) {
  const firstQueryMs = now() - t0; // process start -> ORM ready -> first query done (measured by caller start)
  await ops.page(db, HOT);
  const replyTargets: string[] = (await ops.page(db, HOT)).items.map((r: any) => r.id);
  const res: any = { orm: name, round, node: process.version, firstQueryMs: +firstQueryMs.toFixed(1) };
  for (let i = 0; i < 300; i++) await ops.page(db, HOT, cursors[i % cursors.length]); // warmup
  res.page_seq = await timed(3000, (i) => ops.page(db, HOT, cursors[(i * 7) % cursors.length]));
  res.page_conc10 = await concurrent(5000, 10, (i) => ops.page(db, HOT, cursors[(i * 13) % cursors.length]));
  res.byid_seq = await timed(5000, (i) => ops.byId(db, replyTargets[i % replyTargets.length]));
  res.insert_seq = await timed(2000, (i) => ops.insertOne(db, INS_PARENT, i));
  res.insert_batch500 = await timed(20, (i) => ops.insertBatch(db, INS_PARENT, 500, i * 500));
  res.reply_tx = await timed(1000, (i) => ops.reply(db, replyTargets[i % replyTargets.length], i));
  res.upsert_batch1000 = await timed(20, (i) => ops.upsertAccounts(db, Array.from({ length: 1000 }, (_, k) => ({ unionId: String(95000 + i * 500 + k), nickname: `n${round}_${i}_${k}`, avatarUrl: null }))));
  res.stats_groupby = await timed(30, () => ops.stats(db, HOT));
  if (typeof global.gc === "function") global.gc();
  const m = process.memoryUsage(); res.mem = { rssMB: +(m.rss / 1048576).toFixed(1), heapUsedMB: +(m.heapUsed / 1048576).toFixed(1) };
  await close();
  writeFileSync(`../raw/09-bench-${name}-r${round}.json`, JSON.stringify(res, null, 2));
  console.log(JSON.stringify({ orm: name, round, page_p50: res.page_seq.p50, page_p95: res.page_seq.p95, ins: res.insert_seq.opsPerSec, rss: res.mem.rssMB }));
}
