import { HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '@nexo/shared/auth';
import { ApiHttpException } from '@nexo/shared/http';

const RATE_LIMITED_MESSAGE =
  'Você enviou mensagens rápido demais. Aguarde um instante e tente de novo.';
const ANONYMOUS_TRACKER = 'anonymous';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: AuthenticatedRequest): Promise<string> {
    return Promise.resolve(request.session?.userId ?? ANONYMOUS_TRACKER);
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new ApiHttpException({
      code: 'rate_limited',
      message: RATE_LIMITED_MESSAGE,
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
