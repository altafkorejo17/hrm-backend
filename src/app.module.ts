/**
 * @file        app.module.ts
 * @description Root application module. Registers global config with Joi
 *              validation, database connection and the health-check module.
 * @author      Altaf
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { configValidationSchema } from './config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
      validationSchema: configValidationSchema,
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
