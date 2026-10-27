import type { UserRecord } from './user-record.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(userId: string): Promise<UserRecord | null>;
  findByIds(userIds: string[]): Promise<UserRecord[]>;
}
