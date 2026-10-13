import { Migration } from '@mikro-orm/migrations';

export class Migration20261012103327_m2_unique_to_index extends Migration {

  override name = 'Migration20261012103327_m2_unique_to_index';

  override up(): void | Promise<void> {
    this.addSql(`drop index "comments_nonce_uk";`);
    this.addSql(`drop index "comments_popular_idx";`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id","parent_id","popularity_score" desc,"id");`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id","union_id","nonce") where "nonce" is not null;`);

    this.addSql(`alter table "comment_media" drop constraint "comment_media_comment_id_sort_order_unique";`);
    this.addSql(`create index "comment_media_comment_id_sort_order_index" on "comment_media" ("comment_id", "sort_order");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "comment_media_comment_id_sort_order_index";`);
    this.addSql(`alter table "comment_media" add constraint "comment_media_comment_id_sort_order_unique" unique ("comment_id", "sort_order");`);

    this.addSql(`drop index "comments_index";`);
    this.addSql(`drop index "comments_unique";`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id", "union_id", "nonce") where nonce IS NOT NULL;`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id", "parent_id", "popularity_score" DESC, "id");`);
  }

}
