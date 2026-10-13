#!/usr/bin/env python3
"""Generate synthetic schemas + a fixed query file for tsc perf tests.
usage: ts-perf-gen.py <N> <outdir>   (outdir contains d045/ d1rc/ prisma/ project dirs)
Each table: 12 columns (uuid pk, text, varchar, int, bigint, bool, numeric, jsonb, enum, 2 timestamps, nullable FK parent_id -> previous table, owner_id -> table 0).
Relations: t_i.parent -> t_{i-1} (one), t_{i-1}.children -> t_i (many), t_i.owner -> t_0 (one).
Query file: 20 queries on tables spread across the schema (same count for every N)."""
import sys, os
N = int(sys.argv[1]); out = sys.argv[2]
T = [f"t{i}" for i in range(N)]
qt = sorted({min(N-1, max(1, round(k*(N-1)/19))) for k in range(20)})
def w(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w").write(s)

def dcols(i):
    c = f'''  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: varchar("slug", {{ length: 120 }}).notNull(),
  count: integer("count").notNull().default(0),
  big: bigint("big", {{ mode: "number" }}),
  active: boolean("active").notNull().default(true),
  price: numeric("price"),
  meta: jsonb("meta"),
  status: statusEnum("status").notNull().default("a"),
  createdAt: timestamp("created_at", {{ withTimezone: true }}).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {{ withTimezone: true }}).notNull().defaultNow(),
'''
    if i > 0:
        c += f'  parentId: uuid("parent_id").references(() => t{i-1}.id),\n  ownerId: uuid("owner_id").references(() => t0.id),\n'
    return c

hdr = 'import { pgTable, pgEnum, uuid, text, varchar, integer, bigint, boolean, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";\nexport const statusEnum = pgEnum("status", ["a", "b", "c"]);\n'
tables = "".join(f'export const t{i}: any_t{i} = pgTable("t{i}", {{\n{dcols(i)}}});\n' for i in range(N))
# self-referencing via () => avoids TS7022 only with explicit annotation; use plain consts ordered (t{i-1} defined before t{i}) instead
tables = "".join(f'export const t{i} = pgTable("t{i}", {{\n{dcols(i)}}});\n' for i in range(N))

for v in ("d045", "d1rc"):
    w(f"{out}/{v}/src/schema.ts", hdr + tables)

# drizzle 0.45: RQB v1 relations()
r1 = 'import { relations } from "drizzle-orm";\nimport * as s from "./schema";\n'
for i in range(N):
    parts = []
    if i > 0:
        parts += [f"parent: one(s.t{i-1}, {{ fields: [s.t{i}.parentId], references: [s.t{i-1}.id], relationName: \"p{i}\" }})",
                  f"owner: one(s.t0, {{ fields: [s.t{i}.ownerId], references: [s.t0.id], relationName: \"o{i}\" }})"]
    if i < N-1: parts.append(f"children: many(s.t{i+1}, {{ relationName: \"p{i+1}\" }})")
    if i == 0: parts += [f"owned{j}: many(s.t{j}, {{ relationName: \"o{j}\" }})" for j in range(1, N)]
    r1 += f"export const t{i}Rel = relations(s.t{i}, ({{ one, many }}) => ({{ {', '.join(parts)} }}));\n"
w(f"{out}/d045/src/relations.ts", r1)

# drizzle 1.0 rc: RQB v2 defineRelations()
r2 = 'import { defineRelations } from "drizzle-orm";\nimport * as s from "./schema";\nexport const relations = defineRelations(s, (r) => ({\n'
for i in range(N):
    parts = []
    if i > 0:
        parts += [f"parent: r.one.t{i-1}({{ from: r.t{i}.parentId, to: r.t{i-1}.id, alias: \"p{i}\" }})",
                  f"owner: r.one.t0({{ from: r.t{i}.ownerId, to: r.t0.id, alias: \"o{i}\" }})"]
    if i < N-1: parts.append(f"children: r.many.t{i+1}({{ alias: \"p{i+1}\" }})")
    if i == 0: parts += [f"owned{j}: r.many.t{j}({{ alias: \"o{j}\" }})" for j in range(1, N)]
    r2 += f"  t{i}: {{ {', '.join(parts)} }},\n"
r2 += "}));\n"
w(f"{out}/d1rc/src/relations.ts", r2)

def dq(v):
    s = 'import { drizzle } from "drizzle-orm/node-postgres";\nimport { eq, and, desc } from "drizzle-orm";\nimport * as schema from "./schema";\n'
    if v == "d045":
        s += 'import * as rel from "./relations";\nexport const db = drizzle(process.env.DATABASE_URL!, { schema: { ...schema, ...rel } });\n'
    else:
        s += 'import { relations } from "./relations";\nexport const db = drizzle(process.env.DATABASE_URL!, { relations });\n'
    s += "export async function run(id: string) {\n"
    for k, i in enumerate(qt):
        t = f"schema.t{i}"
        if k % 4 == 0:
            if v == "d045":
                s += f'  const q{k} = await db.query.t{i}.findMany({{ where: eq({t}.id, id), with: {{ parent: {{ with: {{ children: true }} }}, owner: true, {"children: true," if i < N-1 else ""} }}, limit: 10 }});\n'
            else:
                s += f'  const q{k} = await db.query.t{i}.findMany({{ where: {{ id }}, with: {{ parent: {{ with: {{ children: true }} }}, owner: true, {"children: true," if i < N-1 else ""} }}, limit: 10 }});\n'
            s += f'  const n{k}: string | undefined = q{k}[0]?.owner?.title;\n'
        elif k % 4 == 1:
            s += f'  const q{k} = await db.select({{ id: {t}.id, title: {t}.title, p: schema.t{i-1}.title }}).from({t}).innerJoin(schema.t{i-1}, eq({t}.parentId, schema.t{i-1}.id)).where(and(eq({t}.active, true), eq({t}.status, "a"))).orderBy(desc({t}.createdAt)).limit(20);\n'
            s += f'  const n{k}: string = q{k}[0].p;\n'
        elif k % 4 == 2:
            s += f'  const q{k} = await db.insert({t}).values({{ title: "x", slug: "x", parentId: id, ownerId: id }}).returning();\n  const n{k}: Date = q{k}[0].createdAt;\n'
        else:
            s += f'  const q{k} = await db.update({t}).set({{ count: 1, meta: {{ a: 1 }} }}).where(eq({t}.id, id)).returning({{ id: {t}.id }});\n  const n{k}: string = q{k}[0].id;\n'
    s += "  return [" + ", ".join(f"n{k}" for k in range(len(qt))) + "];\n}\n"
    w(f"{out}/{v}/src/queries.ts", s)
dq("d045"); dq("d1rc")

# Prisma
p = 'generator client {\n  provider = "prisma-client"\n  output   = "../src/generated"\n}\ndatasource db {\n  provider = "postgresql"\n}\nenum Status {\n  a\n  b\n  c\n}\n'
for i in range(N):
    p += f"model t{i} {{\n  id String @id @default(uuid()) @db.Uuid\n  title String\n  slug String @db.VarChar(120)\n  count Int @default(0)\n  big BigInt?\n  active Boolean @default(true)\n  price Decimal?\n  meta Json?\n  status Status @default(a)\n  createdAt DateTime @default(now()) @map(\"created_at\") @db.Timestamptz\n  updatedAt DateTime @default(now()) @map(\"updated_at\") @db.Timestamptz\n"
    if i > 0:
        p += f"  parentId String? @map(\"parent_id\") @db.Uuid\n  ownerId String? @map(\"owner_id\") @db.Uuid\n"
        p += f"  parent t{i-1}? @relation(\"p{i}\", fields: [parentId], references: [id])\n  owner t0? @relation(\"o{i}\", fields: [ownerId], references: [id])\n"
    if i < N-1: p += f"  children t{i+1}[] @relation(\"p{i+1}\")\n"
    if i == 0: p += "".join(f"  owned{j} t{j}[] @relation(\"o{j}\")\n" for j in range(1, N))
    p += "}\n"
w(f"{out}/prisma/prisma/schema.prisma", p)
s = 'import { PrismaClient } from "./generated/client";\nimport { PrismaPg } from "@prisma/adapter-pg";\nexport const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });\nexport async function run(id: string) {\n'
for k, i in enumerate(qt):
    if k % 4 == 0:
        s += f'  const q{k} = await db.t{i}.findMany({{ where: {{ id }}, include: {{ parent: {{ include: {{ children: true }} }}, owner: true, {"children: true," if i < N-1 else ""} }}, take: 10 }});\n  const n{k}: string | undefined = q{k}[0]?.owner?.title;\n'
    elif k % 4 == 1:
        s += f'  const q{k} = await db.t{i}.findMany({{ where: {{ active: true, status: "a" }}, select: {{ id: true, title: true, parent: {{ select: {{ title: true }} }} }}, orderBy: {{ createdAt: "desc" }}, take: 20 }});\n  const n{k}: string | undefined = q{k}[0].parent?.title;\n'
    elif k % 4 == 2:
        s += f'  const q{k} = await db.t{i}.create({{ data: {{ title: "x", slug: "x", parentId: id, ownerId: id }} }});\n  const n{k}: Date = q{k}.createdAt;\n'
    else:
        s += f'  const q{k} = await db.t{i}.update({{ where: {{ id }}, data: {{ count: 1, meta: {{ a: 1 }} }}, select: {{ id: true }} }});\n  const n{k}: string = q{k}.id;\n'
s += "  return [" + ", ".join(f"n{k}" for k in range(len(qt))) + "];\n}\n"
w(f"{out}/prisma/src/queries.ts", s)
w(f"{out}/prisma/prisma.config.ts", 'import { defineConfig } from "prisma/config";\nexport default defineConfig({ schema: "prisma/schema.prisma", datasource: { url: "postgresql://postgres@127.0.0.1:5432/x" } });\n')
tsc = '{\n  "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "strict": true, "skipLibCheck": true, "noEmit": true, "types": ["node"] },\n  "include": ["src"]\n}\n'
for v in ("d045", "d1rc", "prisma"): w(f"{out}/{v}/tsconfig.json", tsc)
print("queries on tables:", qt)
