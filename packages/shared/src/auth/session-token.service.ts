import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type UserRole, userRoleSchema } from '@nexo/contracts';
import { errors, jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import { AppConfig } from '../config/app-config.service.js';
import type { SessionClaims } from './session-claims.js';

const SIGNING_ALGORITHM = 'HS256';
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_HOUR = 60 * 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

const payloadSchema = z.object({
  sub: z.string().min(1),
  role: userRoleSchema,
  sid: z.string().min(1),
  exp: z.number(),
});

export type IssueSessionInput = {
  userId: string;
  role: UserRole;
  remember: boolean;
};

export type IssuedSession = {
  token: string;
  claims: SessionClaims;
};

@Injectable()
export class SessionTokenService {
  private readonly key: Uint8Array;

  constructor(private readonly config: AppConfig) {
    this.key = new TextEncoder().encode(this.config.get('JWT_SECRET'));
  }

  async issue(input: IssueSessionInput): Promise<IssuedSession> {
    const lifetime = this.lifetimeInMilliseconds(input.remember);
    const expiresAt = new Date(Date.now() + lifetime);
    const claims: SessionClaims = {
      userId: input.userId,
      role: input.role,
      sessionId: randomUUID(),
      expiresAt,
    };
    const token = await new SignJWT({ role: claims.role, sid: claims.sessionId })
      .setProtectedHeader({ alg: SIGNING_ALGORITHM })
      .setSubject(claims.userId)
      .setExpirationTime(Math.floor(expiresAt.getTime() / MILLISECONDS_PER_SECOND))
      .sign(this.key);
    return { token, claims };
  }

  async verify(token: string): Promise<SessionClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: [SIGNING_ALGORITHM] });
      return this.toClaims(payload);
    } catch (error: unknown) {
      if (error instanceof errors.JOSEError) {
        return null;
      }
      throw error;
    }
  }

  private toClaims(payload: unknown): SessionClaims | null {
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return null;
    }
    const { sub, role, sid, exp } = parsed.data;
    return {
      userId: sub,
      role,
      sessionId: sid,
      expiresAt: new Date(exp * MILLISECONDS_PER_SECOND),
    };
  }

  private lifetimeInMilliseconds(remember: boolean): number {
    if (remember) {
      return this.config.get('SESSION_REMEMBER_DAYS') * MILLISECONDS_PER_DAY;
    }
    return this.config.get('SESSION_TTL_HOURS') * MILLISECONDS_PER_HOUR;
  }
}
