import type { DuplicateCheck, TicketCategory, TicketDetail } from '@nexo/contracts';

const MINIMUM_KEYWORD_LENGTH = 3;
const WORD_SEPARATOR = /[^a-z0-9]+/;
const COMBINING_MARKS = /\p{M}/gu;
const IGNORED_WORDS = new Set([
  'nao',
  'com',
  'que',
  'uma',
  'para',
  'meu',
  'minha',
  'por',
  'mas',
  'dos',
  'das',
  'nos',
  'mais',
  'esta',
  'estou',
  'foi',
  'tem',
  'fica',
  'desde',
  'quando',
  'depois',
  'ainda',
  'sem',
  'erro',
]);

function keywordsOf(text: string): Set<string> {
  const normalized = text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
  const words = normalized.split(WORD_SEPARATOR);
  const relevant = words.filter(
    (word) => word.length >= MINIMUM_KEYWORD_LENGTH && !IGNORED_WORDS.has(word),
  );
  return new Set(relevant);
}

function sharesKeyword(ticket: TicketDetail, text: string): boolean {
  const wanted = keywordsOf(text);
  return [...keywordsOf(`${ticket.title} ${ticket.description}`)].some((word) => wanted.has(word));
}

export type DuplicateQuery = {
  tickets: TicketDetail[];
  category: TicketCategory;
  text: string;
};

export function findOpenDuplicates(query: DuplicateQuery): DuplicateCheck {
  const sameSubject = query.tickets.filter(
    (ticket) => ticket.category === query.category && sharesKeyword(ticket, query.text),
  );
  const openMatches = sameSubject.filter((ticket) => ticket.status !== 'resolved');
  return {
    openMatches,
    reopenable: [],
    expiredResolved: sameSubject.filter((ticket) => ticket.status === 'resolved'),
    rule:
      openMatches.length > 0
        ? 'há chamado aberto sobre o mesmo problema: atualize em vez de abrir outro'
        : 'sem chamado aberto sobre o mesmo problema: segue para abertura',
  };
}
