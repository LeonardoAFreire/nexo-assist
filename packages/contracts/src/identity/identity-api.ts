import type { UserProfile } from './user-profile.js';

export const IDENTITY_API = Symbol('IDENTITY_API');

export interface IdentityApi {
  findProfiles(input: { userIds: string[] }): Promise<UserProfile[]>;
}
