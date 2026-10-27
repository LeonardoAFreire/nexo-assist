import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../core/password-hasher.js';

const BCRYPT_COST = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_COST);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
