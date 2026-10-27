import { Inject, Injectable, type OnApplicationBootstrap, type OnModuleInit } from '@nestjs/common';
import { DEMO_PEOPLE } from '@nexo/contracts';
import { DATABASE, type Database, runMigrations } from '@nexo/shared/database';
import { IDENTITY_SCHEMA, usersTable } from './users.table.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;

@Injectable()
export class IdentityBootstrap implements OnModuleInit, OnApplicationBootstrap {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onModuleInit(): Promise<void> {
    await runMigrations(this.database, { folder: MIGRATIONS_FOLDER, schema: IDENTITY_SCHEMA });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.database
      .insert(usersTable)
      .values(DEMO_PEOPLE.map((person) => ({ ...person })))
      .onConflictDoNothing();
  }
}
