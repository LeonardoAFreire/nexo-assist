import type { PasswordHasher } from './password-hasher.js';

export class PasswordPolicy {
  constructor(
    private readonly hasher: PasswordHasher,
    private readonly enforced: boolean,
  ) {}

  async accepts(plain: string, storedHash: string | null): Promise<boolean> {
    if (!this.enforced) {
      return true;
    }
    if (storedHash === null) {
      return false;
    }
    return this.hasher.verify(plain, storedHash);
  }
}
