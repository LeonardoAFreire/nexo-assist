import { and, eq, or, sql, type SQL } from 'drizzle-orm';
import {
  ACCENTED,
  SEARCH_LANGUAGE,
  TICKET_SEARCH_VECTOR,
  UNACCENTED,
} from './ticket-search-vector.js';
import { ticketsTable } from './tickets.table.js';

export type OwnSearch = {
  requesterId: string;
  query: string;
};

export function matchesOwnSearch(input: OwnSearch): SQL | undefined {
  const accentFreeQuery = sql`translate(${input.query}, ${ACCENTED}, ${UNACCENTED})`;
  const tsQuery = sql`websearch_to_tsquery(${SEARCH_LANGUAGE}::regconfig, ${accentFreeQuery})`;
  return and(
    eq(ticketsTable.requesterId, input.requesterId),
    or(
      sql`${sql.raw(TICKET_SEARCH_VECTOR)} @@ ${tsQuery}`,
      sql`position(lower(${input.query}) in lower(${ticketsTable.number})) > 0`,
    ),
  );
}
