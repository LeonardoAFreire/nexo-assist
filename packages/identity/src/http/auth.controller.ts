import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { type LoginRequest, loginRequestSchema, type SessionUser } from '@nexo/contracts';
import {
  CurrentSession,
  OriginGuard,
  type SessionClaims,
  type CookieResponse,
  SessionCookieService,
  SessionGuard,
} from '@nexo/shared/auth';
import { ApiHttpException, ZodValidationPipe } from '@nexo/shared/http';
import { IdentityService } from '../core/identity.service.js';
import { InvalidCredentialsError } from '../core/invalid-credentials.error.js';
import { LoginUseCase } from '../core/login.use-case.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly identity: IdentityService,
    private readonly cookies: SessionCookieService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OriginGuard)
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<SessionUser> {
    try {
      const result = await this.loginUseCase.execute(body);
      this.cookies.set(response, { token: result.token, expiresAt: result.expiresAt });
      return result.user;
    } catch (error: unknown) {
      throw toHttpException(error);
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OriginGuard)
  logout(@Res({ passthrough: true }) response: CookieResponse): void {
    this.cookies.clear(response);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async me(@CurrentSession() session: SessionClaims): Promise<SessionUser> {
    const user = await this.identity.findSessionUser(session);
    if (!user) {
      throw unauthenticated();
    }
    return user;
  }
}

function unauthenticated(): ApiHttpException {
  return new ApiHttpException({
    code: 'unauthenticated',
    message: 'Sessão ausente ou expirada. Entre novamente.',
    status: HttpStatus.UNAUTHORIZED,
  });
}

function toHttpException(error: unknown): unknown {
  if (!(error instanceof InvalidCredentialsError)) {
    return error;
  }
  return new ApiHttpException({
    code: 'invalid_credentials',
    message: error.message,
    status: HttpStatus.UNAUTHORIZED,
  });
}
