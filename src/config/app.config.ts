/**
 * @file        config/app.config.ts
 * @description Registers the 'app' config namespace.
 *              Exposes APP_NAME, NODE_ENV and PORT from environment variables.
 *              Access via ConfigService: config.get('app.port')
 * @author      Altaf
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'HRM Backend',
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
}));
