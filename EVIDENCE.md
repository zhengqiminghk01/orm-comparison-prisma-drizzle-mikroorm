# 证据索引：报告结论 → raw 文件

本文件把 `index.html` 的关键结论对应到 `raw/` 中的原始输出。所有摘录是原文，未修改。截图由 `scripts/render_evidence.py` 从 raw 文件按行号渲染。渲染只删除 ANSI 控制字符。

## 说明

- raw 文件中的绝对路径已替换为 `./` 或 `<home>`。其他内容未修改。
- `raw/05-ai-guardrail.log` 第 7 行和第 29 行是 Prisma 的 agent 检测消息。测试在 AI coding agent 的 shell 中执行，Prisma 按环境变量识别出该 agent。第 7 行的 agent 产品名在 raw 日志中已替换为 `<AI agent>`。第 23、29 行在 raw 日志中保留原文；本文件的摘录和截图 02 中，agent 产品名及其环境变量名替换为 `<AI agent>`。
- 已删除：`raw/05-ai-guardrail.log` 中列出 agent 环境变量名的行。这些行只有变量名，值显示为 `<set>`。

## 结论与证据

| # | 结论 | 证据文件 | 截图 |
|---|---|---|---|
| 1 | Benchmark 表格的全部数字（p50、p95、ops/s，3 轮） | `raw/09-bench-{prisma,drizzle,mikro}-r{1,2,3}.json`；汇总 `raw/09-bench-aggregate.json`、`raw/09-bench-summary.txt`；控制台 `raw/09-bench-console.log` | `09-bench-summary.png` |
| 2 | 冷启动与打包体积 | `raw/12-coldstart.jsonl`、`raw/12-bundle-size.txt` | 无 |
| 3 | 读写分离：读走 replica，写和事务走 primary | `raw/08-routing-primary.log`、`raw/08-routing-replica.log`；汇总 `raw/08-routing-summary.txt` | `08-read-write-routing.png` |
| 4 | Prisma 拒绝执行会丢数据的 rename，exit code 为 1 | `raw/03-prisma-migrations.log` 第 100–116 行 | `01-prisma-rename-refusal.png` |
| 5 | `prisma migrate reset --force` 在 agent 环境下被拒绝；数据保留 2 行 | `raw/05-ai-guardrail.log` 第 1–45 行 | `02-prisma-migrate-reset-blocked.png` |
| 6 | `drizzle-kit push --force` 删除有数据的列，exit code 为 0 | `raw/05-ai-guardrail.log` 第 52–60 行 | `03-drizzle-push-force-data-loss.png` |
| 7 | `mikro-orm schema:fresh --run` 清空数据，exit code 为 0 | `raw/05-ai-guardrail.log` 第 47–50 行 | `04-mikro-schema-fresh-wipe.png` |
| 8 | drizzle-kit rename 必须有 TTY；没有 TTY 时报错，exit code 为 0 | `raw/03-drizzle-migrations.log` 第 56–68 行 | `05-drizzle-rename-tty-exit0.png` |
| 9 | enum 加值 + 回填：Prisma 成功；Drizzle 和 MikroORM 在同一文件中失败 | `raw/03-prisma-migrations.log` 第 152–181 行；`prisma/prisma/migrations/20261012102941_m5_enum_backfill/migration.sql`；`raw/03-drizzle-migrations.log` 第 124–148 行；`raw/03-mikro-migrations.log` 第 225–361 行 | `06-enum-backfill.png` |
| 10 | cursor 查询：OR 条件 29.715 ms；row-value 0.154 ms；OR + 冗余条件 0.077 ms | `raw/10-explain.txt` | `07-cursor-explain.png` |
| 11 | Drift 检测结果，以及 MikroORM 没有 drift 时的误报 | `raw/04-drift.log` | 无 |
| 12 | MikroORM down() 引用不存在的索引 | `raw/03-mikro-migrations.log` 第 138–224 行 | 无 |
| 13 | Prisma partial index 必须开启 preview feature | `raw/02-prisma-partial-index.txt` | 无 |
| 14 | 版本号 | `raw/01-versions.txt`、`raw/01-prisma-version.txt`、`raw/00-node-version.txt`、`raw/00-postgres-setup.txt` | 无 |
| 15 | npm `latest` 指向 Prisma 8.0.0-rc.22 | `raw/01-prisma-dist-tags.json` | 无 |
| 16 | 生态数据（stars、下载量、发布数） | `raw/11-ecosystem.txt` | 无 |
| 17 | NestJS 启动时间 | `raw/13-nest-boot.txt` | 无 |
| 18 | 代码行数 | `raw/14-loc.txt` | 无 |
| 19 | Prisma ORM 写法的批量 upsert：每批 457–790 ms | `raw/15-prisma-upsert-orm-path.txt` | 无 |
| 20 | MikroORM 去掉 `as any` 后的 TS2345 | `raw/07-mikro-tsc-without-as-any.txt` | 无 |
| 21 | Drizzle 0.45.4 的 tsc Check time 随表数增长：10 表 0.43 s，200 表 3.39 s | `raw/ts-perf/N{10,50,100,200}-d045-run{1,2,3}.txt`；汇总 `raw/ts-perf/summary.txt` | `10-ts-typecheck-summary.png` |
| 22 | Drizzle 1.0.0-rc.4 在 200 表时 Check time 0.74 s，Instantiations 110,145 | `raw/ts-perf/N200-d1rc-run{1,2,3}.txt` | `10-ts-typecheck-summary.png` |
| 23 | Prisma 7.10.0 Check time 0.17–0.28 s；200 表时 generated client 598,924 行，内存 861 MB | `raw/ts-perf/N*-prisma-run*.txt`、`raw/ts-perf/N200-prisma-generated-lines.txt` | `10-ts-typecheck-summary.png` |
| 24 | 改 1 行后增量构建的 Check time 都低于 0.2 s | `raw/ts-perf/N*-*-incr.txt` | 无 |
| 25 | 测试版本与机器 | `raw/ts-perf/versions.txt` | 无 |

## 关键摘录

**#4 Prisma rename**（`raw/03-prisma-migrations.log`）

```
109:  • You are about to drop the column `display_username` on the `accounts` table, which still contains 2 non-null values.
111:Error: Prisma Migrate has detected that the environment is non-interactive, which is not supported.
116:exit=1
```

**#5 migrate reset**（`raw/05-ai-guardrail.log`）

```
7:Error: Prisma Migrate detected that it was invoked by <AI agent>.
22:exit=1
29:Error: Prisma Migrate detected that it was invoked by <AI agent>.
44:exit=1
45:             2
```

第 45 行是复制库中 accounts 表的行数。

**#6 drizzle-kit push --force**（`raw/05-ai-guardrail.log`）

```
52:### DRIZZLE: add drift col with data then push --force under agent env (copy db b_reset_d)
59:exit=0
60:     0
```

第 60 行是执行后 `important_data` 列的数量（查询 `information_schema.columns`）。第 52–60 行中有 "[✓] Changes applied"（行内含 ANSI 控制字符，见截图 03）。

**#7 mikro-orm schema:fresh**（`raw/05-ai-guardrail.log`）

```
48:Schema successfully dropped and recreated
49:exit=0
50:                   0
```

第 50 行是执行后 accounts 表的行数。

**#8 drizzle rename 没有 TTY**（`raw/03-drizzle-migrations.log`）

```
59:Error: Interactive prompts require a TTY terminal (process.stdin.isTTY or process.stdout.isTTY is false). ...
68:exit=0
```

**#9 enum + 回填**

```
raw/03-prisma-migrations.log:181:deploy exit=0
raw/03-drizzle-migrations.log:142:ERROR: unsafe use of new value "deleted" of enum type comment_status
raw/03-mikro-migrations.log:271:DriverException: unsafe use of new value "deleted" of enum type comment_status
raw/03-mikro-migrations.log:361: {pending,hidden,public,deleted}
```

**#10 cursor EXPLAIN**（`raw/10-explain.txt`）

```
9:         Rows Removed by Filter: 98798
14: Execution Time: 29.715 ms
30: Execution Time: 0.154 ms
46: Execution Time: 0.077 ms
```

**#21 tsc 输出**（`raw/ts-perf/N200-d045-run1.txt`）

```
11:Instantiations:            1481747
24:Check time:                  3.39s
28:exit=0
```

社区报告的链接、日期和读取方式（已抓取或仅搜索摘要）见 `ts-perf.md` 和 `index.html` §2.4。

## 证据不足的结论

- 未验证：tsserver 补全延迟、drizzle-zod / tRPC 叠加影响、宽表、tsgo。`raw/ts-perf/` 只有 `tsc` 数据。

- 未确认：Prisma M5 在同一文件中成功的原因。raw 中没有 PG statement 日志。确认方法：开启 `log_statement=all` 后重跑 M5。
- 未验证：MikroORM 改用结构化 index 定义后，index churn 是否消失。raw 中没有该测试。
- `raw/09-bench-console.log` 第 1、4、7 行的 VACUUM 报错说明轮次之间没有执行 VACUUM ANALYZE。
