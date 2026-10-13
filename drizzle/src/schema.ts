import { pgTable, smallint, pgEnum, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { uuidv7 } from "./uuidv7";

export const commentStatus = pgEnum("comment_status", ["pending", "hidden", "public", "deleted"]);
const ts = (n: string) => timestamp(n, { withTimezone: true, mode: "date" });
const audit = {
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().$onUpdate(() => new Date()),
  deletedAt: ts("deleted_at"),
};
const id = () => uuid("id").primaryKey().$defaultFn(uuidv7);

export const tenants = pgTable("tenants", {
  id: id(),
  tenantName: text("tenant_name").notNull(),
  storageProfile: text("storage_profile").notNull(),
  ...audit,
});
export const tenantSettings = pgTable("tenant_settings", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().unique().references(() => tenants.id),
  postIntervalSeconds: integer("post_interval_seconds"),
  dailyQuota: integer("daily_quota"),
  replyEnabled: boolean("reply_enabled").notNull().default(true),
  moderationEnabled: boolean("moderation_enabled").notNull().default(true),
  ...audit,
});
export const comments = pgTable("comments", {
  id: id(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  parentId: uuid("parent_id").references((): AnyPgColumn => comments.id),
  unionId: text("union_id"),
  content: text("content").notNull(),
  status: commentStatus("status").notNull().default("pending"),
  textStatus: commentStatus("text_status").notNull().default("pending"),
  popularityScore: integer("popularity_score").notNull().default(0),
  moderationResult: jsonb("moderation_result"),
  nonce: text("nonce"),
  ...audit,
}, (t) => [
  index().on(t.tenantId, t.parentId, t.createdAt, t.id),
  index().on(t.tenantId, t.parentId, t.popularityScore.desc(), t.id),
  index().on(t.tenantId, t.unionId, t.createdAt),
  index().on(t.status, t.createdAt),
  uniqueIndex().on(t.tenantId, t.unionId, t.nonce).where(sql`${t.nonce} IS NOT NULL`),
]);
export const commentMedia = pgTable("comment_media", {
  id: id(),
  commentId: uuid("comment_id").notNull().references(() => comments.id),
  sortOrder: integer("sort_order").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storageProfile: text("storage_profile").notNull(),
  storagePath: text("storage_path").notNull(),
  url: text("url"),
  status: commentStatus("status").notNull().default("pending"),
  ...audit,
}, (t) => [index().on(t.commentId, t.sortOrder)]);
export const accounts = pgTable("accounts", {
  unionId: text("union_id").primaryKey(),
  nickname: text("nickname").notNull(),
  avatarUrl: text("avatar_url"),
  accountCreatedAt: ts("account_created_at").notNull(),
  accountStatus: text("account_status").notNull(),
  language: smallint("language").notNull().default(1),
  ...audit,
}, (t) => [index().on(t.createdAt)]);
