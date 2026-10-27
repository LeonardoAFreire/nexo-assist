import { Global, Module } from '@nestjs/common';
import { OriginGuard } from './origin.guard.js';
import { SessionCookieService } from './session-cookie.service.js';
import { SessionTokenService } from './session-token.service.js';
import { SessionGuard } from './session.guard.js';

@Global()
@Module({
  providers: [SessionTokenService, SessionCookieService, SessionGuard, OriginGuard],
  exports: [SessionTokenService, SessionCookieService, SessionGuard, OriginGuard],
})
export class NexoAuthModule {}
