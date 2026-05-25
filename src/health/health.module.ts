/**
 * @file        health/health.module.ts
 * @description Registers the TerminusModule and HealthController.
 *              Imported by AppModule to expose the /health endpoint.
 * @author      Altaf
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
