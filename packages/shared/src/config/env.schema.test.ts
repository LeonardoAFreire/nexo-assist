import { describe, expect, it } from 'vitest';
import { envSchema } from './env.schema.js';

const validEnv = {
  WEB_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: 'a'.repeat(32),
  DATABASE_URL: 'postgres://nexo:nexo@localhost:5432/nexo',
  OPENROUTER_API_KEY: 'chave-ficticia',
};

function failedPaths(raw: Record<string, unknown>): string[] {
  const result = envSchema.safeParse(raw);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

function withoutKey(): Record<string, unknown> {
  const { OPENROUTER_API_KEY: _removed, ...rest } = validEnv;
  return rest;
}

describe('envSchema', () => {
  it('aplica os padrões quando as variáveis opcionais não são informadas', () => {
    const env = envSchema.parse(validEnv);

    expect(env).toMatchObject({
      PORT: 3000,
      LOG_LEVEL: 'info',
      LLM_PROVIDER: 'openrouter',
      AGENT_CONFIDENCE_THRESHOLD: 0.6,
      LLM_DAILY_BUDGET_USD: 2,
      CHAT_RATE_LIMIT_PER_MINUTE: 12,
      SESSION_TTL_HOURS: 8,
      SESSION_REMEMBER_DAYS: 7,
      TICKETS_OUTAGE_MODE: 'off',
      TICKETS_OUTAGE_PROBABILITY: 0.1,
      TICKETS_OUTAGE_DURATION_MS: 4000,
      SEED_DEMO_DATA: true,
    });
  });

  it('trata variáveis vazias do .env.example como ausentes', () => {
    const env = envSchema.parse({ ...validEnv, SERVE_WEB_DIR: '' });

    expect(env.SERVE_WEB_DIR).toBeUndefined();
  });

  it('rejeita JWT_SECRET curto demais', () => {
    expect(failedPaths({ ...validEnv, JWT_SECRET: 'curto' })).toContain('JWT_SECRET');
  });

  it('rejeita configuração sem DATABASE_URL', () => {
    const { DATABASE_URL: _removed, ...withoutDatabase } = validEnv;

    expect(failedPaths(withoutDatabase)).toContain('DATABASE_URL');
  });

  it('rejeita DATABASE_URL que não seja do Postgres', () => {
    const raw = { ...validEnv, DATABASE_URL: 'file:./data/nexo.sqlite' };

    expect(failedPaths(raw)).toContain('DATABASE_URL');
  });

  it('exige OPENROUTER_API_KEY quando o provedor é openrouter', () => {
    expect(failedPaths(withoutKey())).toEqual(['OPENROUTER_API_KEY']);
    expect(failedPaths({ ...withoutKey(), OPENROUTER_API_KEY: '' })).toEqual([
      'OPENROUTER_API_KEY',
    ]);
  });

  it('dispensa OPENROUTER_API_KEY com o provedor scripted fora de produção', () => {
    expect(failedPaths({ ...withoutKey(), LLM_PROVIDER: 'scripted' })).toEqual([]);
  });

  it('recusa o provedor scripted em produção', () => {
    const raw = { ...withoutKey(), LLM_PROVIDER: 'scripted', NODE_ENV: 'production' };

    expect(failedPaths({ ...raw, LOG_LEVEL: 'info' })).toEqual(['LLM_PROVIDER']);
  });

  it('recusa LOG_LEVEL=debug em produção e aceita em desenvolvimento', () => {
    const debugEnv = { ...validEnv, LOG_LEVEL: 'debug' };

    expect(failedPaths({ ...debugEnv, NODE_ENV: 'production' })).toEqual(['LOG_LEVEL']);
    expect(failedPaths({ ...debugEnv, NODE_ENV: 'development' })).toEqual([]);
  });

  it('recusa o JWT_SECRET de exemplo em produção e aceita um segredo próprio', () => {
    const production = { ...validEnv, NODE_ENV: 'production', LOG_LEVEL: 'info' };
    const placeholder = 'change-me-with-at-least-32-characters';
    const strongSecret = 'Zk3vQ9xT2mLw8RpN5sYc7HdF1bGa4JeU';

    expect(failedPaths({ ...production, JWT_SECRET: placeholder })).toEqual(['JWT_SECRET']);
    expect(failedPaths({ ...production, JWT_SECRET: strongSecret })).toEqual([]);
    expect(failedPaths({ ...validEnv, JWT_SECRET: placeholder })).toEqual([]);
  });

  it('rejeita limites fora do intervalo', () => {
    const confidence = { ...validEnv, AGENT_CONFIDENCE_THRESHOLD: '1.5' };
    const budget = { ...validEnv, LLM_DAILY_BUDGET_USD: '0' };

    expect(failedPaths(confidence)).toContain('AGENT_CONFIDENCE_THRESHOLD');
    expect(failedPaths(budget)).toContain('LLM_DAILY_BUDGET_USD');
  });
});
