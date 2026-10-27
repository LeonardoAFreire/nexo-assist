import type { ExecutionContext } from '@nestjs/common';
import { AppConfig } from '../config/app-config.service.js';
import type { Env } from '../config/env.schema.js';
import type { AuthenticatedRequest } from './session-claims.js';

export const TEST_WEB_ORIGIN = 'http://localhost:5173';

const TEST_ENV: Partial<Env> = {
  JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
  SESSION_TTL_HOURS: 8,
  SESSION_REMEMBER_DAYS: 7,
  WEB_ORIGIN: TEST_WEB_ORIGIN,
  NODE_ENV: 'test',
};

export function makeConfig(overrides: Partial<Env> = {}): AppConfig {
  const values = { ...TEST_ENV, ...overrides };
  return { get: (key: keyof Env) => values[key] } as AppConfig;
}

export function makeContext(request: Partial<AuthenticatedRequest>): ExecutionContext {
  const fullRequest: AuthenticatedRequest = { headers: {}, method: 'GET', ...request };
  return {
    switchToHttp: () => ({ getRequest: () => fullRequest }),
    getHandler: () => makeContext,
    getClass: () => AppConfig,
  } as unknown as ExecutionContext;
}
