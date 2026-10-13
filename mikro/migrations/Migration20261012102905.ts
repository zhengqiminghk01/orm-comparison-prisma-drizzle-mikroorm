import { Migration } from '@mikro-orm/migrations';

export class Migration20261012102905 extends Migration {

  override name = 'Migration20261012102905';

  override up(): void | Promise<void> {
    this.addSql(`create type "comment_status" as enum ('pending', 'hidden', 'public');`);
    this.addSql(`create table "accounts" ("union_id" text not null, "display_username" text not null, "avatar_url" text null, "account_created_at" timestamptz not null, "account_status" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("union_id"));`);

    this.addSql(`create table "tenants" ("id" uuid not null, "tenant_name" text not null, "storage_profile" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "comments" ("id" uuid not null, "tenant_id" uuid not null, "parent_id" uuid null, "union_id" text null, "content" text not null, "status" "comment_status" not null default 'pending', "text_status" "comment_status" not null default 'pending', "popularity_score" int not null default 0, "moderation_result" jsonb null, "nonce" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`create index "comments_tenant_id_parent_id_created_at_id_index" on "comments" ("tenant_id", "parent_id", "created_at", "id");`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id","parent_id","popularity_score" desc,"id");`);
    this.addSql(`create index "comments_tenant_id_union_id_created_at_index" on "comments" ("tenant_id", "union_id", "created_at");`);
    this.addSql(`create index "comments_status_created_at_index" on "comments" ("status", "created_at");`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id","union_id","nonce") where "nonce" is not null;`);

    this.addSql(`create table "comment_media" ("id" uuid not null, "comment_id" uuid not null, "sort_order" int not null, "mime_type" text not null, "size_bytes" int not null, "storage_profile" text not null, "storage_path" text not null, "url" text null, "status" "comment_status" not null default 'pending', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "comment_media" add constraint "comment_media_comment_id_sort_order_unique" unique ("comment_id", "sort_order");`);

    this.addSql(`create table "tenant_settings" ("id" uuid not null, "tenant_id" uuid not null, "post_interval_seconds" int null, "daily_quota" int null, "reply_enabled" boolean not null default true, "moderation_enabled" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "tenant_settings" add constraint "tenant_settings_tenant_id_unique" unique ("tenant_id");`);

    this.addSql(`alter table "comments" add constraint "comments_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id");`);
    this.addSql(`alter table "comments" add constraint "comments_parent_id_foreign" foreign key ("parent_id") references "comments" ("id") on delete set null;`);

    this.addSql(`alter table "comment_media" add constraint "comment_media_comment_id_foreign" foreign key ("comment_id") references "comments" ("id");`);

    this.addSql(`alter table "tenant_settings" add constraint "tenant_settings_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id");`);
  }

}
