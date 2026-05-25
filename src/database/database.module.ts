/**
 * @file        database/database.module.ts
 * @description Configures the TypeORM MySQL connection using values from
 *              ConfigService. Uses forRootAsync so the config module is fully
 *              loaded before the DB connection is attempted.
 *              synchronize is enabled only outside production to prevent
 *              accidental schema changes in live environments.
 * @author      Altaf
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // forRootAsync waits for ConfigService to be ready before connecting
    // prevents race condition where .env values are not yet loaded
    TypeOrmModule.forRootAsync({
      // declare ConfigModule as dependency so ConfigService is available
      imports: [ConfigModule],

      // NestJS injects ConfigService as first argument into useFactory
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'mysql',

        // reads values from the 'database' namespace registered in database.config.ts
        host: config.get('database.host'),
        port: config.get<number>('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),

        // auto-discovers all *.entity.ts files anywhere under src/
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],

        // migration files location used by TypeORM CLI
        migrations: [__dirname + '/migrations/*{.ts,.js}'],

        // auto-creates/alters tables in dev — NEVER enable in production (risk of data loss)
        synchronize: process.env.NODE_ENV !== 'production',

        // prints all SQL queries to console in dev for debugging
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
