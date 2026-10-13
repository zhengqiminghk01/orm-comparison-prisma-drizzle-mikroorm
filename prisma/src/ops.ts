import type { Db } from "./db";
import { TENANT, encode, decode } from "../../common/env";

export async function page(db: Db, parentId: string, cursor?: string, limit = 20) {
  const c = cursor ? decode(cursor) : undefined;
  const rows = await db.comment.findMany({
    where: {
      tenantId: TENANT, parentId, deletedAt: null, status: "public",
      ...(c && { createdAt: { lte: c.createdAt }, OR: [{ createdAt: { lt: c.createdAt } }, { createdAt: c.createdAt, id: { lt: c.id } }] }),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: { id: true, unionId: true, content: true, createdAt: true, popularityScore: true },
  });
  const hasMore = rows.length > limit; const items = rows.slice(0, limit);
  return { items, next: hasMore ? encode(items[items.length - 1]) : null };
}

export async function insertOne(db: Db, parentId: string, i: number) {
  await db.comment.create({ data: { tenantId: TENANT, parentId, unionId: String(i % 1000 + 1), content: "bench " + i, status: "public", textStatus: "public" } });
}

export async function insertBatch(db: Db, parentId: string, n: number, base: number) {
  await db.comment.createMany({ data: Array.from({ length: n }, (_, k) => ({ tenantId: TENANT, parentId, unionId: String(k + 1), content: "batch " + (base + k), status: "public" as const, textStatus: "public" as const })) });
}

// transaction-bound check on primary: parent must exist, be a comment (not resource/reply) and not deleted
export async function reply(db: Db, parentId: string, i: number) {
  return db.$transaction(async (tx) => {
    const parent = await tx.comment.findFirst({ where: { id: parentId, tenantId: TENANT, deletedAt: null }, select: { id: true, parentId: true } });
    if (!parent || parent.parentId === null) throw new Error("invalid parent");
    return tx.comment.create({ data: { tenantId: TENANT, parentId: parent.id, unionId: String(i), content: "reply " + i, status: "pending", textStatus: "pending" }, select: { id: true } });
  });
}

// batch upsert of account profiles (eventbus sync / lazy backfill)
export async function upsertAccounts(db: Db, rows: { unionId: string; nickname: string; avatarUrl: string | null }[]) {
  // Prisma has no bulk upsert API: options are N upserts in a transaction, or raw SQL. We use raw SQL (1 round trip).
  const ids = rows.map((r) => r.unionId), names = rows.map((r) => r.nickname), avatars = rows.map((r) => r.avatarUrl);
  await db.$executeRaw`
    INSERT INTO accounts (union_id, nickname, avatar_url, account_created_at, account_status, created_at, updated_at)
    SELECT u, n, a, now(), 'active', now(), now() FROM unnest(${ids}::text[], ${names}::text[], ${avatars}::text[]) AS t(u, n, a)
    ON CONFLICT (union_id) DO UPDATE SET nickname = EXCLUDED.nickname, avatar_url = EXCLUDED.avatar_url, updated_at = now()`;
}
export async function upsertAccountsOrm(db: Db, rows: { unionId: string; nickname: string; avatarUrl: string | null }[]) {
  await db.$transaction(rows.map((r) => db.account.upsert({ where: { unionId: r.unionId }, create: { unionId: r.unionId, nickname: r.nickname, avatarUrl: r.avatarUrl, accountCreatedAt: new Date(), accountStatus: "active" }, update: { nickname: r.nickname, avatarUrl: r.avatarUrl } })));
}

export async function stats(db: Db, parentId: string) {
  return db.comment.groupBy({ by: ["status"], where: { tenantId: TENANT, parentId }, _count: { _all: true }, _avg: { popularityScore: true } });
}

export async function byId(db: Db, id: string) {
  return db.comment.findUnique({ where: { id }, select: { id: true, content: true, createdAt: true } });
}
