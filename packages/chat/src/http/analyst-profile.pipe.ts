import { HttpStatus, Inject, Injectable, type PipeTransform } from '@nestjs/common';
import { IDENTITY_API, type IdentityApi, type UserProfile } from '@nexo/contracts';
import type { SessionClaims } from '@nexo/shared/auth';
import { ApiHttpException } from '@nexo/shared/http';

const UNKNOWN_USER_MESSAGE = 'Sessão ausente ou expirada. Entre novamente.';

@Injectable()
export class AnalystProfilePipe implements PipeTransform<SessionClaims, Promise<UserProfile>> {
  constructor(@Inject(IDENTITY_API) private readonly identity: IdentityApi) {}

  async transform(claims: SessionClaims): Promise<UserProfile> {
    const [profile] = await this.identity.findProfiles({ userIds: [claims.userId] });
    if (profile === undefined || profile.role !== 'analyst') {
      throw new ApiHttpException({
        code: 'unauthenticated',
        message: UNKNOWN_USER_MESSAGE,
        status: HttpStatus.UNAUTHORIZED,
      });
    }
    return profile;
  }
}
