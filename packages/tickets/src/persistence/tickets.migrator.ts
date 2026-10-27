import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { DATABASE, type Database, runMigrations } from '@nexo/shared/database';
import { INITIAL_SEQUENCES } from '../core/ticket-number-generator.js';
import { ticketSequencesTable } from './ticket-sequences.table.js';
import { TICKETS_SCHEMA } from './tickets-schema.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;

@Injectable()
export class TicketsMigrator implements OnModuleInit {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onModuleInit(): Promise<void> {
    await runMigrations(this.database, { folder: MIGRATIONS_FOLDER, schema: TICKETS_SCHEMA });
    const initialRows = Object.entries(INITIAL_SEQUENCES).map(([type, nextValue]) => ({
      type,
      nextValue,
    }));
    await this.database.insert(ticketSequencesTable).values(initialRows).onConflictDoNothing();
  }
}
