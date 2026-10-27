import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { DATABASE, type Database, runMigrations } from '@nexo/shared/database';
import { KNOWLEDGE_SCHEMA } from './articles.table.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;

@Injectable()
export class KnowledgeMigrator implements OnModuleInit {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onModuleInit(): Promise<void> {
    await runMigrations(this.database, { folder: MIGRATIONS_FOLDER, schema: KNOWLEDGE_SCHEMA });
  }
}
