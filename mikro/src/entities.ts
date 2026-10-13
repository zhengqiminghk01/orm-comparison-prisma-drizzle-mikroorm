import { defineEntity, p } from "@mikro-orm/postgresql";
import { uuidv7 } from "./uuidv7";

const audit = {
  createdAt: p.datetime().columnType("timestamptz").onCreate(() => new Date()),
  updatedAt: p.datetime().columnType("timestamptz").onCreate(() => new Date()).onUpdate(() => new Date()),
  deletedAt: p.datetime().columnType("timestamptz").nullable(),
};
const id = () => p.uuid().primary().onCreate(() => uuidv7());
export const CommentStatus = ["pending", "hidden", "public", "deleted"] as const;

export const Tenant = defineEntity({
  name: "Tenant", tableName: "tenants",
  properties: { id: id(), tenantName: p.text(), storageProfile: p.text(), ...audit },
});
export const TenantSetting = defineEntity({
  name: "TenantSetting", tableName: "tenant_settings",
  properties: {
    id: id(),
    tenant: () => p.oneToOne(Tenant).owner().fieldName("tenant_id"),
    postIntervalSeconds: p.integer().nullable(),
    dailyQuota: p.integer().nullable(),
    replyEnabled: p.boolean().default(true),
    moderationEnabled: p.boolean().default(true),
    ...audit,
  },
});
export const Comment = defineEntity({
  name: "Comment", tableName: "comments",
  properties: {
    id: id(),
    tenant: () => p.manyToOne(Tenant).fieldName("tenant_id"),
    parent: () => p.manyToOne(Comment).fieldName("parent_id").nullable(),
    unionId: p.text().nullable(),
    content: p.text(),
    status: p.enum([...CommentStatus]).nativeEnumName("comment_status").default("pending"),
    textStatus: p.enum([...CommentStatus]).nativeEnumName("comment_status").default("pending"),
    popularityScore: p.integer().default(0),
    moderationResult: p.json().nullable(),
    nonce: p.text().nullable(),
    ...audit,
  },
  indexes: [
    { properties: ["tenant", "parent", "createdAt", "id"] },
    { expression: 'create index "comments_popular_idx" on "comments" ("tenant_id","parent_id","popularity_score" desc,"id")' },
    { properties: ["tenant", "unionId", "createdAt"] },
    { properties: ["status", "createdAt"] },
  ],
  uniques: [
    { expression: 'create unique index "comments_nonce_uk" on "comments" ("tenant_id","union_id","nonce") where "nonce" is not null' },
  ],
});
export const CommentMedia = defineEntity({
  name: "CommentMedia", tableName: "comment_media",
  properties: {
    id: id(),
    comment: () => p.manyToOne(Comment).fieldName("comment_id"),
    sortOrder: p.integer(),
    mimeType: p.text(),
    sizeBytes: p.integer(),
    storageProfile: p.text(),
    storagePath: p.text(),
    url: p.text().nullable(),
    status: p.enum([...CommentStatus]).nativeEnumName("comment_status").default("pending"),
    ...audit,
  },
  indexes: [{ properties: ["comment", "sortOrder"] }],
});
export const Account = defineEntity({
  name: "Account", tableName: "accounts",
  properties: {
    unionId: p.text().primary(),
    nickname: p.text(),
    avatarUrl: p.text().nullable(),
    accountCreatedAt: p.datetime().columnType("timestamptz"),
    accountStatus: p.text(),
    language: p.smallint().default(1),
    ...audit,
  },
  indexes: [{ properties: ["createdAt"] }],
});
export const entities = [Tenant, TenantSetting, Comment, CommentMedia, Account];
