import { and, eq, lt, lte, or, isNull, desc, sql, count, avg } from "drizzle-orm";
import type { Db } from "./db";
import { comments, accounts } from "./schema";
import { TENANT, encode, decode } from "../../common/env";

export async function page(db: Db, parentId: string, cursor?: string, limit = 20) {
  const c = cursor ? decode(cursor) : undefined;
  const rows = await db.select({ id: comments.id, unionId: comments.unionId, content: comments.content, createdAt: comments.createdAt, popularityScore: comments.popularityScore })
    .from(comments)
    .where(and(eq(comments.tenantId, TENANT), eq(comments.parentId, parentId), isNull(comments.deletedAt), eq(comments.status, "public"),
      c ? lte(comments.createdAt, c.createdAt) : undefined,
      c ? or(lt(comments.createdAt, c.createdAt), and(eq(comments.createdAt, c.createdAt), lt(comments.id, c.id))) : undefined))
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit; const items = rows.slice(0, limit);
  return { items, next: hasMore ? encode(items[items.length - 1]) : null };
}

export async function insertOne(db: Db, parentId: string, i: number) {
  await db.insert(comments).values({ tenantId: TENANT, parentId, unionId: String(i % 1000 + 1), content: "bench " + i, status: "public", textStatus: "public" });
}

export async function insertBatch(db: Db, parentId: string, n: number, base: number) {
  await db.insert(comments).values(Array.from({ length: n }, (_, k) => ({ tenantId: TENANT, parentId, unionId: String(k + 1), content: "batch " + (base + k), status: "public" as const, textStatus: "public" as const })));
}

export async function reply(db: Db, parentId: string, i: number) {
  return db.transaction(async (tx) => {
    const [parent] = await tx.select({ id: comments.id, parentId: comments.parentId }).from(comments)
      .where(and(eq(comments.id, parentId), eq(comments.tenantId, TENANT), isNull(comments.deletedAt))).limit(1);
    if (!parent || parent.parentId === null) throw new Error("invalid parent");
    const [row] = await tx.insert(comments).values({ tenantId: TENANT, parentId: parent.id, unionId: String(i), content: "reply " + i }).returning({ id: comments.id });
    return row;
  });
}

export async function upsertAccounts(db: Db, rows: { unionId: string; nickname: string; avatarUrl: string | null }[]) {
  await db.insert(accounts)
    .values(rows.map((r) => ({ ...r, accountCreatedAt: new Date(), accountStatus: "active" })))
    .onConflictDoUpdate({ target: accounts.unionId, set: { nickname: sql`excluded.nickname`, avatarUrl: sql`excluded.avatar_url`, updatedAt: sql`now()` } });
}

export async function stats(db: Db, parentId: string) {
  return db.select({ status: comments.status, n: count(), avgScore: avg(comments.popularityScore) })
    .from(comments).where(and(eq(comments.tenantId, TENANT), eq(comments.parentId, parentId))).groupBy(comments.status);
}

export async function byId(db: Db, id: string) {
  const [row] = await db.select({ id: comments.id, content: comments.content, createdAt: comments.createdAt }).from(comments).where(eq(comments.id, id)).limit(1);
  return row;
}
