import { describe, expect, it } from 'vitest';
import type { AppConfig } from '../config/app-config.service.js';
import { SessionCookieService, type CookieOptions } from './session-cookie.service.js';

function cookieOptionsFor(nodeEnv: string): CookieOptions {
  const config = { get: () => nodeEnv } as unknown as AppConfig;
  let captured: CookieOptions | undefined;
  const response = {
    cookie: (_name: string, _value: string, options: CookieOptions) => {
      captured = options;
    },
    clearCookie: () => undefined,
  };
  new SessionCookieService(config).set(response, { token: 'token', expiresAt: new Date() });
  if (captured === undefined) {
    throw new Error('cookie não foi definido');
  }
  return captured;
}

describe('SessionCookieService', () => {
  it('emite o cookie Secure, HttpOnly e SameSite=Lax em produção', () => {
    expect(cookieOptionsFor('production')).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  it('não exige Secure fora de produção, para funcionar em http local', () => {
    expect(cookieOptionsFor('development').secure).toBe(false);
  });
});
