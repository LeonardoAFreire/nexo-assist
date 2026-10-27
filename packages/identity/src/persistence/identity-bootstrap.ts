import { Inject, Injectable, type OnApplicationBootstrap, type OnModuleInit } from '@nestjs/common';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE, type Database, runMigrations } from '@nexo/shared/database';
import { PASSWORD_HASHER, type PasswordHasher } from '../core/password-hasher.js';
import { seedUsers } from './seed-users.js';
import { IDENTITY_SCHEMA } from './users.table.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;

@Injectable()
export class IdentityBootstrap implements OnModuleInit, OnApplicationBootstrap {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    await runMigrations(this.database, { folder: MIGRATIONS_FOLDER, schema: IDENTITY_SCHEMA });
  }

  async onApplicationBootstrap(): Promise<void> {
    await seedUsers(this.database, {
      hasher: this.hasher,
      password: this.config.get('SEED_USER_PASSWORD'),
    });
  }
}
