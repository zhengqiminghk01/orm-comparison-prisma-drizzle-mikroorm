import { Migration } from '@mikro-orm/migrations';

export class Migration20261012103348_m5b_backfill extends Migration {

  override name = 'Migration20261012103348_m5b_backfill';

  override up(): void | Promise<void> {
    this.addSql(`update "comments" set "status"='deleted' where "deleted_at" is not null;`);
    this.addSql(`select 1`);
  }

  override down(): void | Promise<void> {
    this.addSql(`select 1`);
  }

}
