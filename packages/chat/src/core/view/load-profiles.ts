import type { IdentityApi, UserProfile } from '@nexo/contracts';

export type ProfileLookup = Pick<IdentityApi, 'findProfiles'>;

export async function loadProfiles(
  identity: ProfileLookup,
  userIds: readonly (string | null)[],
): Promise<Map<string, UserProfile>> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => id !== null))];
  const profiles = await identity.findProfiles({ userIds: uniqueIds });
  return new Map(profiles.map((profile) => [profile.id, profile]));
}
