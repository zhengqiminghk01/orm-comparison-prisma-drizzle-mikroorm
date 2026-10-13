import { Migration } from '@mikro-orm/migrations';

export class Migration20261012103342_m5_enum_backfill extends Migration {

  override name = 'Migration20261012103342_m5_enum_backfill';

  override up(): void | Promise<void> {
    // (backfill appended below)
    this.addSql(`alter type "comment_status" add value if not exists 'deleted' after 'public';`);
    this.addSql(`drop index "comments_nonce_uk";`);
    this.addSql(`drop index "comments_popular_idx";`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id","parent_id","popularity_score" desc,"id");`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id","union_id","nonce") where "nonce" is not null;`);

    this.addSql(`alter type "comment_status" add value if not exists 'deleted' after 'public';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "comments_index";`);
    this.addSql(`drop index "comments_unique";`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id", "union_id", "nonce") where nonce IS NOT NULL;`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id", "parent_id", "popularity_score" DESC, "id");`);
  }

}
