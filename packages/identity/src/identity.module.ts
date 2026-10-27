import { Global, Module } from '@nestjs/common';
import { IDENTITY_API } from '@nexo/contracts';
import { SessionTokenService } from '@nexo/shared/auth';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE, type Database } from '@nexo/shared/database';
import { IdentityService } from './core/identity.service.js';
import { LoginUseCase } from './core/login.use-case.js';
import { PASSWORD_HASHER, type PasswordHasher } from './core/password-hasher.js';
import { PasswordPolicy } from './core/password-policy.js';
import { USER_REPOSITORY, type UserRepository } from './core/user-repository.js';
import { AuthController } from './http/auth.controller.js';
import { BcryptPasswordHasher } from './persistence/bcrypt-password-hasher.js';
import { DrizzleUserRepository } from './persistence/drizzle-user.repository.js';
import { IdentityBootstrap } from './persistence/identity-bootstrap.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    IdentityBootstrap,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    {
      provide: PasswordPolicy,
      inject: [PASSWORD_HASHER, AppConfig],
      useFactory: (hasher: PasswordHasher, config: AppConfig) =>
        new PasswordPolicy(hasher, config.get('NODE_ENV') === 'production'),
    },
    {
      provide: USER_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleUserRepository(database),
    },
    {
      provide: LoginUseCase,
      inject: [USER_REPOSITORY, SessionTokenService, PasswordPolicy],
      useFactory: (
        users: UserRepository,
        sessions: SessionTokenService,
        passwords: PasswordPolicy,
      ) => new LoginUseCase(users, sessions, passwords),
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
