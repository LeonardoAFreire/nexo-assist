import { Global, Module } from '@nestjs/common';
import { IDENTITY_API } from '@nexo/contracts';
import { SessionTokenService } from '@nexo/shared/auth';
import { DATABASE, type Database } from '@nexo/shared/database';
import { IdentityService } from './core/identity.service.js';
import { LoginUseCase } from './core/login.use-case.js';
import { USER_REPOSITORY, type UserRepository } from './core/user-repository.js';
import { AuthController } from './http/auth.controller.js';
import { DrizzleUserRepository } from './persistence/drizzle-user.repository.js';
import { IdentityBootstrap } from './persistence/identity-bootstrap.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    IdentityBootstrap,
    {
      provide: USER_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleUserRepository(database),
    },
    {
      provide: LoginUseCase,
      inject: [USER_REPOSITORY, SessionTokenService],
      useFactory: (users: UserRepository, sessions: SessionTokenService) =>
        new LoginUseCase(users, sessions),
    },
    {
      provide: IdentityService,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new IdentityService(users),
    },
    { provide: IDENTITY_API, useExisting: IdentityService },
  ],
  exports: [IDENTITY_API],
})
export class IdentityModule {}
