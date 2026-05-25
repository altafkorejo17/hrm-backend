/**
 * @file        config/jwt.config.ts
 * @description Registers the 'jwt' config namespace.
 *              Provides access token and refresh token secrets + expiry values.
 *              Access via ConfigService: config.get('jwt.secret')
 * @author      Altaf
 */

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
}));
