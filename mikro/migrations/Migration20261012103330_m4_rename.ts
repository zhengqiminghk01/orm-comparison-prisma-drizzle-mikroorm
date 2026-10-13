import { Migration } from '@mikro-orm/migrations';

export class Migration20261012103330_m4_rename extends Migration {

  override name = 'Migration20261012103330_m4_rename';

  override up(): void | Promise<void> {
    this.addSql(`alter table "accounts" rename column "display_username" to "nickname";`);

  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "accounts" rename column "nickname" to "display_username";`);

  }

}
