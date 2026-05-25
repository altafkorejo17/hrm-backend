import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default('HRM Backend'),

  DB_HOST: z.string({ error: 'DB_HOST is required' }),
  DB_PORT: z.coerce.number().default(3306),
  DB_USERNAME: z.string({ error: 'DB_USERNAME is required' }),
  DB_PASSWORD: z.string({ error: 'DB_PASSWORD is required' }),
  DB_NAME: z.string({ error: 'DB_NAME is required' }),
  MYSQL_ROOT_PASSWORD: z.string().optional(),

  // Required when Auth module is added
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
});

export type EnvConfig = z.infer<typeof configSchema>;

export function validateConfig(config: Record<string, unknown>): EnvConfig {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Config validation failed:\n${errors}`);
  }

  return result.data;
}
