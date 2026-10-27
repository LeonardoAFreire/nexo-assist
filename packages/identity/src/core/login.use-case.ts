import type { LoginRequest, SessionUser, UserRole } from '@nexo/contracts';
import { InvalidCredentialsError } from './invalid-credentials.error.js';
import { toSessionUser } from './user-profile.js';
import type { UserRepository } from './user-repository.js';

export interface SessionIssuer {
  issue(input: {
    userId: string;
    role: UserRole;
    remember: boolean;
  }): Promise<{ token: string; claims: { expiresAt: Date } }>;
}

export type LoginResult = {
  user: SessionUser;
  token: string;
  expiresAt: Date;
};

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: LoginRequest): Promise<LoginResult> {
    if (input.password.length === 0) {
      throw new InvalidCredentialsError();
    }
    const record = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!record) {
      throw new InvalidCredentialsError();
    }
    const { token, claims } = await this.sessions.issue({
      userId: record.id,
      role: record.role,
      remember: input.remember,
    });
    return { user: toSessionUser(record, claims.expiresAt), token, expiresAt: claims.expiresAt };
  }
}
