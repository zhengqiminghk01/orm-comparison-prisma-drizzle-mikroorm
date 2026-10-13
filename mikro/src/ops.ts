import { type MikroORM, raw } from "@mikro-orm/postgresql";
import { Comment, Account } from "./entities";
import { TENANT, encode, decode } from "../../common/env";
type Db = MikroORM;

export async function page(orm: Db, parentId: string, cursor?: string, limit = 20) {
  const em = orm.em.fork();
  const c = cursor ? decode(cursor) : undefined;
  const rows = await em.find(Comment, {
    tenant: TENANT, parent: parentId, deletedAt: null, status: "public",
    ...(c && { createdAt: { $lte: c.createdAt }, $or: [{ createdAt: { $lt: c.createdAt } }, { createdAt: c.createdAt, id: { $lt: c.id } }] }),
  }, { orderBy: [{ createdAt: "desc" }, { id: "desc" }], limit: limit + 1, fields: ["id", "unionId", "content", "createdAt", "popularityScore"], disableIdentityMap: true });
  const hasMore = rows.length > limit; const items = rows.slice(0, limit);
  return { items, next: hasMore ? encode(items[items.length - 1] as any) : null };
}

export async function insertOne(orm: Db, parentId: string, i: number) {
  const em = orm.em.fork();
  em.create(Comment, { tenant: TENANT, parent: parentId, unionId: String(i % 1000 + 1), content: "bench " + i, status: "public", textStatus: "public" } as any);
  await em.flush();
}

export async function insertBatch(orm: Db, parentId: string, n: number, base: number) {
  const em = orm.em.fork();
  for (let k = 0; k < n; k++) em.create(Comment, { tenant: TENANT, parent: parentId, unionId: String(k + 1), content: "batch " + (base + k), status: "public", textStatus: "public" } as any);
  await em.flush();
}

export async function reply(orm: Db, parentId: string, i: number) {
  return orm.em.fork().transactional(async (em) => {
    const parent = await em.findOne(Comment, { id: parentId, tenant: TENANT, deletedAt: null }, { fields: ["id", "parent"] });
    if (!parent || !parent.parent) throw new Error("invalid parent");
    const row = em.create(Comment, { tenant: TENANT, parent: parent.id, unionId: String(i), content: "reply " + i } as any);
    await em.flush();
    return { id: row.id };
  });
}

export async function upsertAccounts(orm: Db, rows: { unionId: string; nickname: string; avatarUrl: string | null }[]) {
  const em = orm.em.fork();
  await em.upsertMany(Account, rows.map((r) => ({ ...r, accountCreatedAt: new Date(), accountStatus: "active" })) as any,
    { onConflictFields: ["unionId"], onConflictAction: "merge", onConflictMergeFields: ["nickname", "avatarUrl", "updatedAt"] });
}

export async function stats(orm: Db, parentId: string) {
  const em = orm.em.fork();
  return em.createQueryBuilder(Comment, "c")
    .select(["c.status", raw("count(*) as n"), raw("avg(c.popularity_score) as avg_score")])
    .where({ tenant: TENANT, parent: parentId }).groupBy("c.status").execute();
}

export async function byId(orm: Db, id: string) {
  return orm.em.fork().findOne(Comment, { id }, { fields: ["id", "content", "createdAt"], disableIdentityMap: true });
}
