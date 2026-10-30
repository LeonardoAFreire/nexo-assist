import { z } from 'zod';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_PORT = 3000;
const DEFAULT_SEED_PASSWORD = 'senha-local-de-exemplo';
const LEAKED_SEED_PASSWORD = 'senha@1234';

export const PUBLIC_SEED_PASSWORDS: readonly string[] = [
  DEFAULT_SEED_PASSWORD,
  LEAKED_SEED_PASSWORD,
];
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;
const DEFAULT_DAILY_BUDGET_USD = 2;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 12;
const DEFAULT_SESSION_TTL_HOURS = 8;
const DEFAULT_SESSION_REMEMBER_DAYS = 7;
const DEFAULT_OUTAGE_PROBABILITY = 0.1;
const DEFAULT_OUTAGE_DURATION_MS = 4000;
const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\//;

function emptyToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

function optionalText() {
  return z.preprocess(emptyToUndefined, z.string().min(1).optional());
}

const booleanText = z.enum(['true', 'false']).transform((value) => value === 'true');

export const envFields = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  WEB_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(MIN_SECRET_LENGTH),
  DATABASE_URL: z.string().regex(POSTGRES_URL_PATTERN),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LLM_PROVIDER: z.enum(['openrouter', 'scripted']).default('openrouter'),
  OPENROUTER_API_KEY: optionalText(),
  LLM_MODEL: z.string().min(1).default(DEFAULT_MODEL),
  LLM_ROUTER_MODEL: z.string().min(1).default(DEFAULT_MODEL),
  AGENT_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(DEFAULT_CONFIDENCE_THRESHOLD),
  LLM_DAILY_BUDGET_USD: z.coerce.number().positive().default(DEFAULT_DAILY_BUDGET_USD),
  CHAT_RATE_LIMIT_PER_MINUTE: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_RATE_LIMIT_PER_MINUTE),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(DEFAULT_SESSION_TTL_HOURS),
  SESSION_REMEMBER_DAYS: z.coerce.number().positive().default(DEFAULT_SESSION_REMEMBER_DAYS),
  TICKETS_OUTAGE_MODE: z.enum(['off', 'random', 'forced']).default('off'),
  TICKETS_OUTAGE_PROBABILITY: z.coerce.number().min(0).max(1).default(DEFAULT_OUTAGE_PROBABILITY),
  TICKETS_OUTAGE_DURATION_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_OUTAGE_DURATION_MS),
  SEED_DEMO_DATA: booleanText.default(true),
  SEED_USER_PASSWORD: z.string().min(1).default(DEFAULT_SEED_PASSWORD),
  SERVE_WEB_DIR: optionalText(),
};
