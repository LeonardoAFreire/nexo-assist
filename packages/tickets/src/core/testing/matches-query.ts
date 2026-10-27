import { normalizeText } from '../text-similarity.js';
import type { TicketRecord } from '../ticket-record.js';

const WHITESPACE = /\s+/;

export function matchesQuery(ticket: TicketRecord, query: string): boolean {
  const haystack = normalizeText(`${ticket.number} ${ticket.title} ${ticket.description}`);
  const terms = normalizeText(query).split(WHITESPACE).filter(Boolean);
  return terms.length > 0 && terms.every((term: string) => haystack.includes(term));
}
