import { HOT } from "./env";
export async function routing(name: string, db: any, ops: any, close: () => Promise<void>) {
  const { Client } = await import("pg");
  const mark = async (port: number, msg: string) => { const c = new Client({ connectionString: `postgresql://postgres@127.0.0.1:${port}/b_bench?application_name=MARK` }); await c.connect(); await c.query(`select '${msg}'`); await c.end(); };
  const step = async (label: string, fn: () => Promise<any>) => { await mark(5432, "BEGIN " + label); await mark(5433, "BEGIN " + label); await fn(); await mark(5432, "END " + label); await mark(5433, "END " + label); };
  console.log("routing start"); const r = await ops.page(db, HOT);
  const someComment = r.items[0].id;
  await step("READ_page", () => ops.page(db, HOT));
  await step("READ_stats", () => ops.stats(db, HOT));
  await step("WRITE_insert", () => ops.insertOne(db, HOT, 1));
  await step("TX_reply", () => ops.reply(db, someComment, 1));
  await close();
}
