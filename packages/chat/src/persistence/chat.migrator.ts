import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { DATABASE, type Database, runMigrations } from '@nexo/shared/database';
import { CHAT_SCHEMA } from './chat-schema.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;

@Injectable()
export class ChatMigrator implements OnModuleInit {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onModuleInit(): Promise<void> {
    await runMigrations(this.database, { folder: MIGRATIONS_FOLDER, schema: CHAT_SCHEMA });
  }
}
