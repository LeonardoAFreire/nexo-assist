import type { IdentityApi, SessionUser, UserProfile } from '@nexo/contracts';
import { toSessionUser, toUserProfile } from './user-profile.js';
import type { UserRepository } from './user-repository.js';

export class IdentityService implements IdentityApi {
  constructor(private readonly users: UserRepository) {}

  async findProfiles(input: { userIds: string[] }): Promise<UserProfile[]> {
    const records = await this.users.findByIds(input.userIds);
    return records.map(toUserProfile);
  }

  async findSessionUser(input: { userId: string; expiresAt: Date }): Promise<SessionUser | null> {
    const record = await this.users.findById(input.userId);
    return record ? toSessionUser(record, input.expiresAt) : null;
  }
}
