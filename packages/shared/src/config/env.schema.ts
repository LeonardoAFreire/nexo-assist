import { z } from 'zod';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_PORT = 3000;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  WEB_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(MIN_SECRET_LENGTH),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;
