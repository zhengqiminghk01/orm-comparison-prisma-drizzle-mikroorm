# Drizzle 与 Prisma 的 TypeScript 类型检查性能

## 结论

- 已验证：Drizzle 0.45.4（报告使用的版本）的类型检查时间随表数量线性增长。200 张表时 Check time 为 3.39 s，Instantiations 为 1,481,747。
- 已验证：Drizzle 1.0.0-rc.4（Relational Queries v2）在相同 schema 下 Check time 为 0.74 s，Instantiations 为 110,145。
- 已验证：Prisma 7.10.0 的 Check time 在 0.17–0.28 s 之间，几乎不随表数量增长。Prisma 的代价是 generated client 体积：200 张表时为 598,924 行，Memory used 为 861 MB，Total time 为 2.36 s。
- 已验证：社区在 2024-10 至 2026-10 期间多次报告 Drizzle 和 Prisma 的类型性能问题。两个项目都已发布修复。
- 未确认：本次测试规模（200 表、20 个查询）下，三者的 Total time 都低于 5 s。真实项目的编辑器延迟可能更高，原因是 Zod、tRPC 等类型会叠加。

## 术语

- Check time：`tsc --extendedDiagnostics` 输出的类型检查时间。
- Instantiations：TypeScript 的类型实例化次数。该值越大，编辑器越慢。
- RQB v1 / v2：Drizzle Relational Queries 第 1 版（`relations()`）和第 2 版（`defineRelations()`）。

## 社区报告

"已抓取"表示已用 WebFetch 读取原页面。"搜索摘要"表示只读取了搜索结果摘录。

| 日期（UTC） | 来源 | 摘录 | 状态 | 读取方式 |
|---|---|---|---|---|
| 2023-06-21 创建；最后评论 2025-11-20 | [drizzle-orm#800](https://github.com/drizzle-team/drizzle-orm/issues/800) | 2025-02-24："My schema file is around 100 lines with 10 tables, but it's incredibly slow"；2025-04-17："Overall, it was too slow… I had to cut back to prisma."；2025-11-20："60 tables… intellisense take about 10s… after install tsgo… reduced to 500ms" | closed（2023-08 由 0.28.0 关闭，之后仍有新评论） | 已抓取 |
| 2025-03-01 创建；2026-01-03 关闭 | [drizzle-orm#4199](https://github.com/drizzle-team/drizzle-orm/issues/4199) | "Drizzle's type inferrence starts breaking down once you have too many tables."（25 张表）。维护者："fixed in the `beta` tag" | closed，在 v1 beta 修复 | 搜索摘要 |
| 2025 年（具体日期未确认） | [drizzle-orm#4841](https://github.com/drizzle-team/drizzle-orm/issues/4841) 中的维护者路线图 | "improved type performance by ~21.4x … TS v5.9.2: 553.7k -> 25.4k"（3300 行 schema + 990 行 relations） | 已进入 1.0 beta / rc | 搜索摘要 |
| 2026-01-17 创建；2026-02-04 关闭 | [drizzle-orm#5272](https://github.com/drizzle-team/drizzle-orm/issues/5272) | 200+ 张表在 beta.9 出现 "TS7056: The inferred type of this node exceeds the maximum length"；beta.14 修复，报告者已确认 | closed，已修复 | 搜索摘要 |
| 2026-01-15 | [v1.0.0-beta.9 release](https://github.com/drizzle-team/drizzle-orm/releases/tag/v1.0.0-beta.9) | "rework(simplified) `PgColumn` type chain … better type performance" | 已发布 | 搜索摘要 |
| 2026-09-28 | [drizzle-orm#6391](https://github.com/drizzle-team/drizzle-orm/issues/6391) | "0.45.x: `$inferInsert` cost is quadratic in column count (TS2589 at 424 columns); fixed in 1.0"；"1.0.0-beta.22 and 1.0.0-rc.4 are not affected" | open；PR #6421 已关联 | 已抓取 |
| 2025 年（Reddit，具体日期未确认） | [r/typescript](https://www.reddit.com/r/typescript/comments/1o2aq5c/how_do_you_debug_typescript_autocomplete_slowness/) | "i was getting up to 2min autocomplete times just using drizzle and zod even with a small codebase" | 讨论帖 | 搜索摘要 |
| 2026-01-08 创建 | [prisma#29011](https://github.com/prisma/prisma/issues/29011) | Prisma 6 → 7.2："Type Instantiations 11,441,158 → 30,242,287"；2026-04-10："wait 30 seconds for TypeScript information" | closed，由 PR #29592 修复 | 已抓取 |
| 2026-05-30 前后 | [prisma PR #29592](https://github.com/prisma/prisma/pull/29592) | 406 个 model："Type Instantiations 32,823,262 → 2,650,891"，"Check time 16.97s → 2.47s" | merged | 搜索摘要 |
| 2026-07-21 | [Prisma 7.9.0 release](https://github.com/prisma/prisma/releases/tag/7.9.0) | "Fixed a severe TypeScript performance regression introduced in Prisma 7 … back from minutes to seconds" | 已发布。报告使用的 7.10.0 包含该修复 | 已抓取 |
| 日期未确认 | [Prisma 文档：TypeScript performance](https://www.prisma.io/docs/orm/v7/more/troubleshooting/typescript-performance) | 用 `typeof client` 代替 `PrismaClient` 类型，Instantiations 从 2,772,929 降到 152 | 官方建议 | 搜索摘要 |

社区报告的共同点：

1. Drizzle 的类型在编辑时实时推导，所以 schema 越大，编辑器越慢。
2. 2025–2026 年 Drizzle 的类型性能修复都发布在 1.0 beta / rc 中（#4199、#5272、#6391）。#6391 要求把修复移植到 0.45.x，状态为 open。
3. Prisma 的类型是生成的，问题出在 generated client 的体积和个别类型回归。Prisma 7.0–7.8 有一个严重回归，7.9.0 已修复。

## 实测

### 方法

1. `scripts/ts-perf-gen.py` 生成 10、50、100、200 张表的 schema。
   - 每张表有 13–15 列：uuid、text、varchar、integer、bigint、boolean、numeric、jsonb、enum、2 个 timestamptz、2 个外键。
   - 关系：`t_i.parent → t_{i-1}`，`t_{i-1}.children → t_i`，`t_i.owner → t0`。t0 有 N−1 个反向关系。
2. 每个版本使用相同的查询文件，最多 20 个查询（N=10 时为 9 个），分布在整个 schema 上。查询分 4 种：
   - 两层嵌套的关系查询（`with` / `include`）。
   - join 查询（Drizzle）或 select 嵌套（Prisma）。
   - insert ... returning。
   - update ... returning。
3. 每个版本执行 3 次 `tsc -p . --extendedDiagnostics --incremental false`（tsconfig 中 `noEmit: true`、`strict: true`、`skipLibCheck: true`）。
4. 增量测试：先执行一次 `--incremental` 冷构建，然后在 queries.ts 加 1 行，再构建一次。
5. 环境：TypeScript 5.9.3，Node v24.13.0，8 vCPU，15 GB RAM（见 `raw/ts-perf/versions.txt`）。

### 结果（3 次中位数）

| 表数 | 版本 | Types | Instantiations | Memory MB | Check s | Total s | 编辑后 Check s |
|---|---|---|---|---|---|---|---|
| 10 | Drizzle 0.45.4 | 12,605 | 92,730 | 209 | 0.43 | 1.12 | 0.05 |
| 10 | Drizzle 1.0.0-rc.4 | 9,804 | 34,260 | 157 | 0.30 | 0.96 | 0.10 |
| 10 | Prisma 7.10.0 | 4,297 | 9,985 | 151 | 0.17 | 0.70 | 0.03 |
| 50 | Drizzle 0.45.4 | 40,177 | 398,447 | 285 | 1.10 | 1.77 | 0.08 |
| 50 | Drizzle 1.0.0-rc.4 | 17,116 | 72,345 | 196 | 0.41 | 1.00 | 0.17 |
| 50 | Prisma 7.10.0 | 7,300 | 20,133 | 269 | 0.21 | 1.02 | 0.05 |
| 100 | Drizzle 0.45.4 | 73,027 | 759,547 | 315 | 1.75 | 2.44 | 0.08 |
| 100 | Drizzle 1.0.0-rc.4 | 20,666 | 84,945 | 200 | 0.51 | 1.09 | 0.15 |
| 100 | Prisma 7.10.0 | 7,650 | 20,383 | 453 | 0.28 | 1.40 | 0.05 |
| 200 | Drizzle 0.45.4 | 138,727 | 1,481,747 | 496 | 3.39 | 4.12 | 0.09 |
| 200 | Drizzle 1.0.0-rc.4 | 27,766 | 110,145 | 215 | 0.74 | 1.36 | 0.16 |
| 200 | Prisma 7.10.0 | 8,350 | 20,883 | 861 | 0.27 | 2.36 | 0.05 |

Prisma generated client 行数：N=10 为 22,274；N=50 为 119,674；N=100 为 259,424；N=200 为 598,924。

### 分析

- Drizzle 0.45.4：从 10 表到 200 表，Instantiations 增长 16 倍，Check time 增长 7.9 倍。
- Drizzle 1.0.0-rc.4：200 表时 Instantiations 是 0.45.4 的 1/13，Check time 是 0.45.4 的 1/4.6。
- Prisma 7.10.0：Check time 基本不变。Total time 和内存随 generated client 的行数增长，原因是 parse 和 bind 时间增加。
- 增量构建：只改一行时，三者的 Check time 都低于 0.2 s。Total time 没有下降，原因是 tsc 仍然读取全部文件。
- 未确认：编辑后 Check time 低于全量 Check time，可能是由于只有 queries.ts 被重新检查。该数字不等于 tsserver 的补全延迟。

## 限制

- 未验证：tsserver / VS Code 的补全延迟。本次只测量了 `tsc`。
- 未验证：Zod（drizzle-zod）、tRPC、NestJS DTO 的叠加影响。社区报告中的严重案例大多包含这些库。
- 部分完成：schema 是合成的。每张表的列数固定，关系是链状加一个中心表。真实 schema 的结果可能不同。
- 未验证：宽表（数百列）。#6391 报告 0.45.x 的 `$inferInsert` 在列数上呈平方增长。本次每张表少于 16 列。
- 未验证：tsgo（TypeScript 7 native）。社区报告 tsgo 可以把延迟降到原来的 1/5 到 1/20。
- 跳过：MikroORM。本次没有测试。
- Drizzle 1.0.0-rc.4 是 release candidate。npm `latest` 仍指向 0.45.4。迁移到 RQB v2 必须修改 relations 定义和查询的 `where` 写法。

## 证据

| 内容 | 文件 |
|---|---|
| 每次运行的原始输出 | `raw/ts-perf/N<表数>-<d045\|d1rc\|prisma>-run<1-3>.txt` |
| 增量构建输出 | `raw/ts-perf/N<表数>-<版本>-incr.txt` |
| 汇总表 | `raw/ts-perf/summary.txt`、`summary.tsv`（`scripts/ts-perf-summary.py` 生成） |
| Prisma generated client 行数 | `raw/ts-perf/N<表数>-prisma-generated-lines.txt` |
| 源文件行数 | `raw/ts-perf/N<表数>-source-lines.txt` |
| 版本与机器 | `raw/ts-perf/versions.txt` |
| 生成器与运行脚本 | `scripts/ts-perf-gen.py`、`scripts/ts-perf-run.sh` |

## 重现

```bash
W=$PWD/../ts-perf-work   # 任意 repo 外的目录
mkdir -p $W/{d045,d1rc,prisma}
(cd $W/d045 && npm init -y && npm i -E drizzle-orm@0.45.4 pg @types/pg @types/node@24 typescript@5.9)
(cd $W/d1rc && npm init -y && npm i -E drizzle-orm@1.0.0-rc.4 pg @types/pg @types/node@24 typescript@5.9)
(cd $W/prisma && npm init -y && npm i -E prisma@7.10.0 @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 @types/node@24 typescript@5.9)
WORK=$W scripts/ts-perf-run.sh
python3 scripts/ts-perf-summary.py
```
