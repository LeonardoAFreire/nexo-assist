import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@nexo/contracts';
import { ApiHttpException } from '../http/index.js';
import { ROLES_METADATA_KEY } from './roles.decorator.js';
import type { AuthenticatedRequest } from './session-claims.js';
import { SESSION_COOKIE_NAME } from './session-cookie.service.js';
import { SessionTokenService } from './session-token.service.js';

function unauthenticated(): ApiHttpException {
  return new ApiHttpException({
    code: 'unauthenticated',
    message: 'Sessão ausente ou expirada. Entre novamente.',
    status: HttpStatus.UNAUTHORIZED,
  });
}

function forbidden(): ApiHttpException {
  return new ApiHttpException({
    code: 'forbidden',
    message: 'Você não tem permissão para esta ação.',
    status: HttpStatus.FORBIDDEN,
  });
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly tokens: SessionTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE_NAME];
    const claims = token ? await this.tokens.verify(token) : null;
    if (!claims) {
      throw unauthenticated();
    }
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowedRoles && !allowedRoles.includes(claims.role)) {
      throw forbidden();
    }
    request.session = claims;
    return true;
  }
}
