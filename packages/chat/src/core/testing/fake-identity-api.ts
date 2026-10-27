import type { IdentityApi, UserProfile } from '@nexo/contracts';
import { ALL_PEOPLE } from './people.js';

export class FakeIdentityApi implements IdentityApi {
  constructor(private readonly people: readonly UserProfile[] = ALL_PEOPLE) {}

  async findProfiles(input: { userIds: string[] }): Promise<UserProfile[]> {
    return this.people.filter((person) => input.userIds.includes(person.id));
  }
}
