/**
 * @file        health/health.controller.ts
 * @description Exposes GET /api/v1/health to report application liveness.
 *              Checks database connectivity via TypeORM ping.
 *              Used by Docker health checks and monitoring tools.
 * @author      Altaf
 */

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
