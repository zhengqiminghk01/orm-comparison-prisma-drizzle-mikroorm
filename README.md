# Comment Service ORM 比较：Prisma、Drizzle、MikroORM

本仓库保存 ORM 比较的报告、测试代码和原始输出。报告是 `index.html`。结论对应的证据见 `EVIDENCE.md`。

## 结论

推荐 Prisma 7，并锁定精确版本。Drizzle 运行时更快。完整理由见 `index.html`。

## 术语

- primary：PostgreSQL 主库，端口 5432。
- replica：streaming replication 只读副本，端口 5433。
- b_bench：benchmark 数据库。数据为 1,000,051 条 comments 和 100,000 条 accounts。

## 测试环境

| 项目 | 版本 |
|---|---|
| PostgreSQL | 17.11（primary + replica） |
| Node.js | 24.13.0 |
| prisma / @prisma/client | 7.10.0 |
| drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 |
| @mikro-orm/* | 7.2.5 |
| @nestjs/* | 11.x |

MikroORM 7 必须使用 Node ≥ 22.17。npm 的 `latest` tag 指向 Prisma 8 RC，所以安装时必须指定 7.10.0（`package-lock.json` 已锁定）。

## 重现步骤

### 1. 准备 PostgreSQL 17

1. 安装 PostgreSQL 17（`initdb`、`pg_ctl`、`pg_basebackup`、`psql` 必须在 PATH 中）。
2. 执行 `scripts/setup-pg.sh`。脚本创建 primary（5432）和 replica（5433），并创建 b_prisma、b_drizzle、b_mikro。认证方式为 trust，只可以用于本机测试。
3. 可以用 `PG_DATA_PRIMARY` 和 `PG_DATA_REPLICA` 指定数据目录。默认是 `/tmp/pgp` 和 `/tmp/pgr`。

可以改用 Docker 运行 primary 和 replica。本次测试没有使用 Docker，Docker 方式未验证。

### 2. 安装依赖

```bash
for d in common prisma drizzle mikro; do (cd $d && npm ci); done
(cd prisma && npx prisma generate)
```

### 3. 执行 migration

```bash
(cd prisma && npx prisma migrate deploy)
(cd drizzle && npx tsx src/migrate.ts)
(cd mikro && npx mikro-orm migration:up)
```

migration 过程的原始输出在 `raw/03-*-migrations.log`。drizzle-kit 的 rename 必须在 TTY 中选择；`scripts/drizzle_pty_rename.py` 是本次使用的 pty 辅助脚本。

### 4. 创建 b_bench 并写入数据

```bash
psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE b_bench TEMPLATE b_drizzle"
psql -h 127.0.0.1 -U postgres -d b_bench -f scripts/seed.sql
```

`common/cursors.json` 已包含在仓库中（508 个 cursor）。生成它的 SQL 没有保存为脚本。

### 5. 执行 benchmark

```bash
./run-bench.sh
```

脚本执行 3 轮，每轮轮换 ORM 顺序。结果写入 `raw/09-bench-<orm>-r<n>.json`。

可以用环境变量 `PRIMARY_URL`、`REPLICA_URL` 改变连接地址（见 `common/env.ts`）。

### 6. 其他测试

- 读写分离：在每个 ORM 目录执行 `npx tsx src/routing.ts`。执行前必须在 primary 和 replica 设置 `log_statement=all` 和 `log_line_prefix='[%a] '`。此步骤没有脚本。
- 冷启动：`node --import tsx src/coldstart.ts`。
- NestJS 启动：`npx tsx src/nest-boot.ts`。

### 7. TypeScript 类型检查测试

此测试不需要数据库。依赖必须安装在 repo 外的目录：

```bash
W=$PWD/../ts-perf-work
mkdir -p $W/{d045,d1rc,prisma}
(cd $W/d045 && npm init -y && npm i -E drizzle-orm@0.45.4 pg @types/pg @types/node@24 typescript@5.9)
(cd $W/d1rc && npm init -y && npm i -E drizzle-orm@1.0.0-rc.4 pg @types/pg @types/node@24 typescript@5.9)
(cd $W/prisma && npm init -y && npm i -E prisma@7.10.0 @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 @types/node@24 typescript@5.9)
WORK=$W scripts/ts-perf-run.sh        # 输出 raw/ts-perf/
python3 scripts/ts-perf-summary.py   # 生成 summary.txt 和 summary.tsv
```

方法和结果见 `ts-perf.md`。

### 8. 重新生成报告和截图

```bash
python3 scripts/render_evidence.py   # 需要 Pillow 和 DejaVu Sans Mono 字体
python3 build_report.py              # report_template.html + raw/（包括 raw/ts-perf/summary.tsv）→ index.html
```

## 目录结构

| 路径 | 内容 |
|---|---|
| `index.html` | 报告（由 `build_report.py` 生成） |
| `report_template.html`、`build_report.py` | 报告模板和生成脚本 |
| `EVIDENCE.md` | 结论 → raw 文件对照表 |
| `ts-perf.md` | TypeScript 类型检查性能测试的详细说明 |
| `evidence/screenshots/` | 关键证据的终端截图（从 raw 按行号渲染） |
| `raw/` | 全部原始输出 |
| `common/` | 共用代码：连接设置、benchmark、路由测试、cursors.json |
| `prisma/`、`drizzle/`、`mikro/` | 每个 ORM 的 schema、migration、NestJS 模块、测试代码 |
| `scripts/` | PG 设置、seed、pty 辅助、截图渲染 |
| `run-bench.sh` | benchmark 入口 |

## 限制

- 3 轮之间的 VACUUM ANALYZE 失败（`raw/09-bench-console.log`）。`run-bench.sh` 已修正为分开执行，修正后的脚本未重跑。
- 测试在单机上执行。primary 和 replica 在同一主机。网络延迟没有计入。
