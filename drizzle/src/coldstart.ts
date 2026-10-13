import { performance } from "node:perf_hooks";
import { createDb, closeDb } from "./db";
import * as ops from "./ops";
(async () => {
  const tImport = performance.now();
  const db: any = await createDb();
  const tInit = performance.now();
  await ops.byId(db, "00000000-0000-7000-9000-000000000000");
  const tQuery = performance.now();
  console.log(JSON.stringify({ importMs: +tImport.toFixed(1), initMs: +(tInit - tImport).toFixed(1), firstQueryMs: +(tQuery - tInit).toFixed(1), totalMs: +tQuery.toFixed(1), rssMB: +(process.memoryUsage().rss / 1048576).toFixed(1) }));
  await closeDb(db);
})();
