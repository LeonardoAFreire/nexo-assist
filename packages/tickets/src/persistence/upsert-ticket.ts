import type { Database } from '@nexo/shared/database';
import type { TicketRow } from './ticket-row-mapper.js';
import { ticketsTable } from './tickets.table.js';

export async function upsertTicket(database: Database, row: TicketRow): Promise<void> {
  await database
    .insert(ticketsTable)
    .values(row)
    .onConflictDoUpdate({
      target: ticketsTable.number,
      set: {
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        affected: row.affected,
        status: row.status,
        lastUpdatedAt: row.lastUpdatedAt,
        resolvedAt: row.resolvedAt,
      },
    });
}
