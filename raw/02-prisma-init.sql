-- CreateEnum
CREATE TYPE "comment_status" AS ENUM ('pending', 'hidden', 'public');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "storage_profile" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "post_interval_seconds" INTEGER,
    "daily_quota" INTEGER,
    "reply_enabled" BOOLEAN NOT NULL DEFAULT true,
    "moderation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "union_id" TEXT,
    "content" TEXT NOT NULL,
    "status" "comment_status" NOT NULL DEFAULT 'pending',
    "text_status" "comment_status" NOT NULL DEFAULT 'pending',
    "popularity_score" INTEGER NOT NULL DEFAULT 0,
    "moderation_result" JSONB,
    "nonce" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_media" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_profile" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT,
    "status" "comment_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "comment_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "union_id" TEXT NOT NULL,
    "display_username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "account_created_at" TIMESTAMPTZ NOT NULL,
    "account_status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("union_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key" ON "tenant_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "comments_tenant_id_parent_id_created_at_id_idx" ON "comments"("tenant_id", "parent_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "comments_tenant_id_parent_id_popularity_score_id_idx" ON "comments"("tenant_id", "parent_id", "popularity_score" DESC, "id");

-- CreateIndex
CREATE INDEX "comments_tenant_id_union_id_created_at_idx" ON "comments"("tenant_id", "union_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_status_created_at_idx" ON "comments"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "comment_media_comment_id_sort_order_key" ON "comment_media"("comment_id", "sort_order");

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_media" ADD CONSTRAINT "comment_media_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
