const WEB_ORIGIN = 'http://localhost:5173';

export function configValues(outageMode: string): Record<string, unknown> {
  return {
    JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
    SESSION_TTL_HOURS: 8,
    SESSION_REMEMBER_DAYS: 7,
    WEB_ORIGIN,
    NODE_ENV: 'test',
    SEED_DEMO_DATA: true,
    TICKETS_OUTAGE_MODE: outageMode,
    TICKETS_OUTAGE_PROBABILITY: 0,
    TICKETS_OUTAGE_DURATION_MS: 4000,
  };
}

export function fakeLogger(loggedErrors: unknown[]) {
  return {
    setContext: () => undefined,
    error: (...args: unknown[]) => loggedErrors.push(args),
  };
}
