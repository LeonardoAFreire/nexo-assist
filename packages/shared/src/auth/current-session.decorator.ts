import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, SessionClaims } from './session-claims.js';

export function readCurrentSession(context: ExecutionContext): SessionClaims {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.session) {
    throw new Error('CurrentSession usado em rota sem SessionGuard');
  }
  return request.session;
}

export const CurrentSession = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  readCurrentSession(context),
);
