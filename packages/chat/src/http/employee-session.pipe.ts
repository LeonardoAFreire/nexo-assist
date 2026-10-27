import { HttpStatus, Inject, Injectable, type PipeTransform } from '@nestjs/common';
import { IDENTITY_API, type IdentityApi } from '@nexo/contracts';
import type { SessionClaims } from '@nexo/shared/auth';
import { ApiHttpException } from '@nexo/shared/http';
import type { EmployeeSession } from '../core/send/turn-context.js';

const UNKNOWN_USER_MESSAGE = 'Sessão ausente ou expirada. Entre novamente.';

@Injectable()
export class EmployeeSessionPipe implements PipeTransform<SessionClaims, Promise<EmployeeSession>> {
  constructor(@Inject(IDENTITY_API) private readonly identity: IdentityApi) {}

  async transform(claims: SessionClaims): Promise<EmployeeSession> {
    const [profile] = await this.identity.findProfiles({ userIds: [claims.userId] });
    if (profile === undefined) {
      throw new ApiHttpException({
        code: 'unauthenticated',
        message: UNKNOWN_USER_MESSAGE,
        status: HttpStatus.UNAUTHORIZED,
      });
    }
    return { userId: profile.id, userName: profile.name, sessionId: claims.sessionId };
  }
}
