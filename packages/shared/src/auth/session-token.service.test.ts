import { SignJWT } from 'jose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeConfig } from './auth-test-support.js';
import { SessionTokenService } from './session-token.service.js';

const USER_ID = '6f1c2a8e-3b7d-4e55-9a10-1d2f3c4b5a61';
const EIGHT_HOURS_IN_MILLISECONDS = 8 * 60 * 60 * 1000;
const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

function makeService(secret?: string): SessionTokenService {
  return new SessionTokenService(makeConfig(secret ? { JWT_SECRET: secret } : {}));
}

describe('SessionTokenService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('assina e verifica a sessão devolvendo usuário, papel e sessão', async () => {
    const service = makeService();
    const { token, claims } = await service.issue({
      userId: USER_ID,
      role: 'analyst',
      remember: false,
    });
    const verified = await service.verify(token);
    expect(verified?.userId).toBe(USER_ID);
    expect(verified?.role).toBe('analyst');
    expect(verified?.sessionId).toBe(claims.sessionId);
  });

  it('expira em SESSION_TTL_HOURS ou em SESSION_REMEMBER_DAYS quando lembrar', async () => {
    vi.useFakeTimers();
    const service = makeService();
    const short = await service.issue({ userId: USER_ID, role: 'employee', remember: false });
    const long = await service.issue({ userId: USER_ID, role: 'employee', remember: true });
    const now = Date.now();
    expect(short.claims.expiresAt.getTime()).toBe(now + EIGHT_HOURS_IN_MILLISECONDS);
    expect(long.claims.expiresAt.getTime()).toBe(now + SEVEN_DAYS_IN_MILLISECONDS);
  });

  it('recusa token expirado', async () => {
    vi.useFakeTimers();
    const service = makeService();
    const { token } = await service.issue({ userId: USER_ID, role: 'employee', remember: false });
    vi.advanceTimersByTime(EIGHT_HOURS_IN_MILLISECONDS + 1000);
    expect(await service.verify(token)).toBeNull();
  });

  it('recusa token assinado com outro segredo', async () => {
    const issuer = makeService('outro-segredo-de-teste-com-32-caracteres-ou-mais');
    const { token } = await issuer.issue({ userId: USER_ID, role: 'employee', remember: false });
    expect(await makeService().verify(token)).toBeNull();
  });

  it('recusa lixo e token sem os campos esperados', async () => {
    const service = makeService();
    const key = new TextEncoder().encode(makeConfig().get('JWT_SECRET'));
    const incomplete = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(USER_ID)
      .setExpirationTime('1h')
      .sign(key);
    expect(await service.verify('isto-nao-e-um-jwt')).toBeNull();
    expect(await service.verify(incomplete)).toBeNull();
  });
});
