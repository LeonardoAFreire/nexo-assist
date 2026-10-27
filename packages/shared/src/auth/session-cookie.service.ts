import { Injectable } from '@nestjs/common';
import { AppConfig } from '../config/app-config.service.js';

export const SESSION_COOKIE_NAME = 'nexo_session';

export type CookieOptions = {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  expires?: Date;
};

export type CookieResponse = {
  cookie(name: string, value: string, options: CookieOptions): unknown;
  clearCookie(name: string, options: CookieOptions): unknown;
};

@Injectable()
export class SessionCookieService {
  constructor(private readonly config: AppConfig) {}

  set(response: CookieResponse, input: { token: string; expiresAt: Date }): void {
    response.cookie(SESSION_COOKIE_NAME, input.token, this.options(input.expiresAt));
  }

  clear(response: CookieResponse): void {
    response.clearCookie(SESSION_COOKIE_NAME, this.options());
  }

  private options(expires?: Date): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      path: '/',
      expires,
    };
  }
}
