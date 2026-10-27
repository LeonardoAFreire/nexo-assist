import { describe, expect, it } from 'vitest';
import { envSchema } from './env.schema.js';

const validEnv = {
  WEB_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: 'a'.repeat(32),
  DATABASE_URL: 'file:./data/nexo.sqlite',
};

describe('envSchema', () => {
  it('aplica porta e nível de log padrão quando não informados', () => {
    const env = envSchema.parse(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('rejeita JWT_SECRET curto demais', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: 'curto' });

    expect(result.success).toBe(false);
  });

  it('rejeita configuração sem DATABASE_URL', () => {
    const { DATABASE_URL: _removed, ...withoutDatabase } = validEnv;

    expect(envSchema.safeParse(withoutDatabase).success).toBe(false);
  });
});
