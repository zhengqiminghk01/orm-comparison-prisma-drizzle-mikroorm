import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ormConfig } from "./db";
@Module({ imports: [MikroOrmModule.forRoot(ormConfig)] })
export class DbModule {}
