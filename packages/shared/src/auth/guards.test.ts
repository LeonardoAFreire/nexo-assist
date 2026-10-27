import { Reflector } from '@nestjs/core';
import type { UserRole } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeConfig, makeContext, TEST_WEB_ORIGIN } from './auth-test-support.js';
import { OriginGuard } from './origin.guard.js';
import { Roles } from './roles.decorator.js';
import { SESSION_COOKIE_NAME } from './session-cookie.service.js';
import { SessionTokenService } from './session-token.service.js';
import { SessionGuard } from './session.guard.js';

const USER_ID = '6f1c2a8e-3b7d-4e55-9a10-1d2f3c4b5a61';

function handleAnalystRoute(): void {}

@Roles('analyst')
class AnalystOnlyController {
  readonly name = 'analyst-only';
}

function makeGuard(): { guard: SessionGuard; tokens: SessionTokenService } {
  const tokens = new SessionTokenService(makeConfig());
  return { guard: new SessionGuard(tokens, new Reflector()), tokens };
}

async function cookieFor(tokens: SessionTokenService, role: UserRole): Promise<string> {
  const { token } = await tokens.issue({ userId: USER_ID, role, remember: false });
  return token;
}

function contextWithRoles(cookie: string | undefined) {
  const context = makeContext({ cookies: { [SESSION_COOKIE_NAME]: cookie } });
  return Object.assign(context, {
    getClass: () => AnalystOnlyController,
    getHandler: () => handleAnalystRoute,
  });
}

describe('SessionGuard', () => {
  it('anexa a sessão à requisição quando o cookie é válido', async () => {
    const { guard, tokens } = makeGuard();
    const request = { cookies: { [SESSION_COOKIE_NAME]: await cookieFor(tokens, 'employee') } };
    const context = makeContext(request);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const attached = context.switchToHttp().getRequest<typeof request & { session: unknown }>();
    expect(attached.session).toMatchObject({ userId: USER_ID, role: 'employee' });
  });

  it('responde 401 unauthenticated sem cookie', async () => {
    const { guard } = makeGuard();
    const attempt = guard.canActivate(makeContext({ cookies: {} }));
    await expect(attempt).rejects.toMatchObject({ code: 'unauthenticated', status: 401 });
  });

  it('responde 401 unauthenticated com cookie adulterado', async () => {
    const { guard, tokens } = makeGuard();
    const tampered = `${await cookieFor(tokens, 'employee')}x`;
    const attempt = guard.canActivate(
      makeContext({ cookies: { [SESSION_COOKIE_NAME]: tampered } }),
    );
    await expect(attempt).rejects.toMatchObject({ code: 'unauthenticated', status: 401 });
  });

  it('responde 403 forbidden quando o papel não está em @Roles', async () => {
    const { guard, tokens } = makeGuard();
    const context = contextWithRoles(await cookieFor(tokens, 'employee'));
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'forbidden',
      status: 403,
    });
  });

  it('libera o papel permitido por @Roles', async () => {
    const { guard, tokens } = makeGuard();
    const context = contextWithRoles(await cookieFor(tokens, 'analyst'));
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});

describe('OriginGuard', () => {
  const guard = new OriginGuard(makeConfig());

  it('aceita escrita vinda de WEB_ORIGIN', () => {
    const context = makeContext({ method: 'POST', headers: { origin: TEST_WEB_ORIGIN } });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('recusa escrita de outra origem ou sem origem com 403 forbidden', () => {
    const foreign = makeContext({ method: 'POST', headers: { origin: 'https://evil.example' } });
    const missing = makeContext({ method: 'DELETE' });
    expect(() => guard.canActivate(foreign)).toThrowError(expect.objectContaining({ status: 403 }));
    expect(() => guard.canActivate(missing)).toThrowError(expect.objectContaining({ status: 403 }));
  });

  it('não exige origem em leituras', () => {
    expect(guard.canActivate(makeContext({ method: 'GET' }))).toBe(true);
  });
});
