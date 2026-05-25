import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './config/database.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // forRoot initializes ConfigModule once at the root level
    ConfigModule.forRoot({
      // makes ConfigService available in every module without re-importing ConfigModule
      isGlobal: true,

      // registers the database namespace config (database.host, database.port, etc.)
      load: [databaseConfig],

      // reads environment variables from this file
      envFilePath: '.env',
    }),

    // sets up the TypeORM MySQL connection using values from ConfigService
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
