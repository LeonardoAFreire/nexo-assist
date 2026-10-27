const DEFAULT_BACKEND_PORT = '3017';
const DEFAULT_WEB_PORT = '5177';
const DEFAULT_DATABASE_URL = 'postgres://nexo:nexo@localhost:5432/nexo_e2e';
const E2E_JWT_SECRET = 'segredo-e2e-com-pelo-menos-32-caracteres';
const E2E_RATE_LIMIT_PER_MINUTE = '120';

const backendPort = process.env.E2E_BACKEND_PORT ?? DEFAULT_BACKEND_PORT;
const webPort = process.env.E2E_WEB_PORT ?? DEFAULT_WEB_PORT;

export const webOrigin = `http://localhost:${webPort}`;
export const backendHealthUrl = `http://localhost:${backendPort}/api/health`;
export const webPortNumber = Number(webPort);

export const backendEnvironment: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: backendPort,
  WEB_ORIGIN: webOrigin,
  JWT_SECRET: E2E_JWT_SECRET,
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? DEFAULT_DATABASE_URL,
  LOG_LEVEL: 'warn',
  LLM_PROVIDER: 'scripted',
  SEED_DEMO_DATA: 'true',
  TICKETS_OUTAGE_MODE: 'off',
  CHAT_RATE_LIMIT_PER_MINUTE: E2E_RATE_LIMIT_PER_MINUTE,
};

export const webEnvironment: Record<string, string> = {
  VITE_API_URL: `http://localhost:${backendPort}/api`,
};
