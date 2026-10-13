import { Migration } from '@mikro-orm/migrations';

export class Migration20261012103325_m1_add_language extends Migration {

  override name = 'Migration20261012103325_m1_add_language';

  override up(): void | Promise<void> {
    this.addSql(`alter table "accounts" add "language" smallint not null default 1;`);

    this.addSql(`drop index "comments_nonce_uk";`);
    this.addSql(`drop index "comments_popular_idx";`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id","parent_id","popularity_score" desc,"id");`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id","union_id","nonce") where "nonce" is not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "accounts" drop column "language";`);

    this.addSql(`drop index "comments_index";`);
    this.addSql(`drop index "comments_unique";`);
    this.addSql(`create unique index "comments_nonce_uk" on "comments" ("tenant_id", "union_id", "nonce") where nonce IS NOT NULL;`);
    this.addSql(`create index "comments_popular_idx" on "comments" ("tenant_id", "parent_id", "popularity_score" DESC, "id");`);
  }

}
