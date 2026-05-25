import { registerAs } from '@nestjs/config';

// Groups all DB env vars under the 'database' namespace
// Access values via config.get('database.host'), config.get('database.port'), etc.
export default registerAs('database', () => ({
  // Docker service name resolves as hostname inside the container network
  host: process.env.DB_HOST,

  // process.env always returns string — parseInt converts to number for TypeORM
  // fallback to 3306 if DB_PORT is not set in .env
  port: parseInt(process.env.DB_PORT ?? '3306', 10),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,

  // Named 'name' to avoid collision with TypeORM's own 'database' option key
  name: process.env.DB_NAME,
}));
