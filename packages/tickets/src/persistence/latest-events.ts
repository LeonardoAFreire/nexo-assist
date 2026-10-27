import type { Database } from '@nexo/shared/database';
import { desc, inArray } from 'drizzle-orm';
import { ticketEventsTable } from './ticket-events.table.js';
import { toTicketRecord, type TicketEventRow, type TicketRow } from './ticket-row-mapper.js';
import type { TicketRecord } from '../core/ticket-record.js';

export async function hydrateTickets(
  database: Database,
  rows: TicketRow[],
): Promise<TicketRecord[]> {
  if (rows.length === 0) {
    return [];
  }
  const numbers = rows.map((row: TicketRow) => row.number);
  const events = await database
    .select()
    .from(ticketEventsTable)
    .where(inArray(ticketEventsTable.ticketNumber, numbers))
    .orderBy(desc(ticketEventsTable.occurredAt));
  const latestByNumber = new Map<string, TicketEventRow>();
  for (const event of events) {
    if (!latestByNumber.has(event.ticketNumber)) {
      latestByNumber.set(event.ticketNumber, event);
    }
  }
  return rows.map((row: TicketRow) => toTicketRecord(row, latestByNumber.get(row.number)));
}
