import { Inject, Injectable } from '@nestjs/common';
import type { TicketType } from '@nexo/contracts';
import { DATABASE, type Database } from '@nexo/shared/database';
import { and, eq, sql } from 'drizzle-orm';
import type { TicketRecord } from '../core/ticket-record.js';
import type {
  RequesterIdempotencyKey,
  RequesterSearch,
  RequesterTicketKey,
  TicketRepository,
  TicketSave,
} from '../core/ticket-repository.js';
import { hydrateTickets } from './latest-events.js';
import { ticketEventsTable } from './ticket-events.table.js';
import { toEventRow, toTicketRow } from './ticket-row-mapper.js';
import { ticketSequencesTable } from './ticket-sequences.table.js';
import { matchesOwnSearch } from './ticket-text-search.js';
import { ticketsTable } from './tickets.table.js';
import { upsertTicket } from './upsert-ticket.js';

@Injectable()
export class DrizzleTicketRepository implements TicketRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async listByRequester(requesterId: string): Promise<TicketRecord[]> {
    const rows = await this.database
      .select()
      .from(ticketsTable)
      .where(eq(ticketsTable.requesterId, requesterId));
    return hydrateTickets(this.database, rows);
  }

  async search(input: RequesterSearch): Promise<TicketRecord[]> {
    const rows = await this.database.select().from(ticketsTable).where(matchesOwnSearch(input));
    return hydrateTickets(this.database, rows);
  }

  async findByNumber(input: RequesterTicketKey): Promise<TicketRecord | null> {
    const rows = await this.database
      .select()
      .from(ticketsTable)
      .where(
        and(eq(ticketsTable.requesterId, input.requesterId), eq(ticketsTable.number, input.number)),
      );
    const [ticket] = await hydrateTickets(this.database, rows);
    return ticket ?? null;
  }

  async findByIdempotencyKey(input: RequesterIdempotencyKey): Promise<TicketRecord | null> {
    const rows = await this.database
      .select({ ticket: ticketsTable })
      .from(ticketsTable)
      .innerJoin(ticketEventsTable, eq(ticketEventsTable.ticketNumber, ticketsTable.number))
      .where(
        and(
          eq(ticketsTable.requesterId, input.requesterId),
          eq(ticketEventsTable.idempotencyKey, input.idempotencyKey),
        ),
      );
    const [ticket] = await hydrateTickets(
      this.database,
      rows.map((row) => row.ticket),
    );
    return ticket ?? null;
  }

  async save(input: TicketSave): Promise<void> {
    const row = toTicketRow(input.ticket);
    await this.database.transaction(async (transaction) => {
      await upsertTicket(transaction, row);
      await transaction.insert(ticketEventsTable).values(toEventRow(row.number, input.event));
    });
  }

  async nextSequence(type: TicketType): Promise<number> {
    const rows = await this.database
      .update(ticketSequencesTable)
      .set({ nextValue: sql`${ticketSequencesTable.nextValue} + 1` })
      .where(eq(ticketSequencesTable.type, type))
      .returning({ nextValue: ticketSequencesTable.nextValue });
    const updated = rows[0];
    if (updated === undefined) {
      throw new Error(`Sequência de chamados não inicializada: ${type}`);
    }
    return updated.nextValue - 1;
  }

  async count(): Promise<number> {
    const rows = await this.database
      .select({ total: sql<number>`count(*)::int` })
      .from(ticketsTable);
    return rows[0]?.total ?? 0;
  }
}
