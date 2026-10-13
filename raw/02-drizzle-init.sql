CREATE TYPE "public"."comment_status" AS ENUM('pending', 'hidden', 'public');--> statement-breakpoint
CREATE TABLE "accounts" (
	"union_id" text PRIMARY KEY NOT NULL,
	"display_username" text NOT NULL,
	"avatar_url" text,
	"account_created_at" timestamp with time zone NOT NULL,
	"account_status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comment_media" (
	"id" uuid PRIMARY KEY NOT NULL,
	"comment_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_profile" text NOT NULL,
	"storage_path" text NOT NULL,
	"url" text,
	"status" "comment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_id" uuid,
	"union_id" text,
	"content" text NOT NULL,
	"status" "comment_status" DEFAULT 'pending' NOT NULL,
	"text_status" "comment_status" DEFAULT 'pending' NOT NULL,
	"popularity_score" integer DEFAULT 0 NOT NULL,
	"moderation_result" jsonb,
	"nonce" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"post_interval_seconds" integer,
	"daily_quota" integer,
	"reply_enabled" boolean DEFAULT true NOT NULL,
	"moderation_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenant_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_name" text NOT NULL,
	"storage_profile" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "comment_media" ADD CONSTRAINT "comment_media_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comment_media_comment_id_sort_order_index" ON "comment_media" USING btree ("comment_id","sort_order");--> statement-breakpoint
CREATE INDEX "comments_tenant_id_parent_id_created_at_id_index" ON "comments" USING btree ("tenant_id","parent_id","created_at","id");--> statement-breakpoint
CREATE INDEX "comments_tenant_id_parent_id_popularity_score_id_index" ON "comments" USING btree ("tenant_id","parent_id","popularity_score" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "comments_tenant_id_union_id_created_at_index" ON "comments" USING btree ("tenant_id","union_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_status_created_at_index" ON "comments" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "comments_tenant_id_union_id_nonce_index" ON "comments" USING btree ("tenant_id","union_id","nonce") WHERE "comments"."nonce" IS NOT NULL;