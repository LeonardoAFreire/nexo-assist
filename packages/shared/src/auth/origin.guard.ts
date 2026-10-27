import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AppConfig } from '../config/app-config.service.js';
import { ApiHttpException } from '../http/index.js';
import type { AuthenticatedRequest } from './session-claims.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }
    const allowedOrigin = new URL(this.config.get('WEB_ORIGIN')).origin;
    if (request.headers.origin !== allowedOrigin) {
      throw new ApiHttpException({
        code: 'forbidden',
        message: 'Origem não permitida.',
        status: HttpStatus.FORBIDDEN,
      });
    }
    return true;
  }
}
