import { ticketSummarySchema } from '@nexo/contracts';
import type { DuplicateCheck, TicketCategory, TicketSummary } from '@nexo/contracts';
import { REOPEN_WINDOW_DAYS, type ReopenPolicy } from './reopen-policy.js';
import { areTextsSimilar } from './text-similarity.js';
import type { TicketRecord } from './ticket-record.js';

export type DuplicateSearch = {
  requesterId: string;
  category: TicketCategory;
  text: string;
  tickets: TicketRecord[];
  now: Date;
};

const OPEN_MATCH_RULE =
  'já existe chamado aberto sobre o mesmo problema: atualizar em vez de criar';
const NO_MATCH_RULE = 'nenhum chamado semelhante: pode abrir um novo chamado';
const EXPIRED_RULE = `chamado resolvido há mais de ${REOPEN_WINDOW_DAYS} dias: abrir um novo chamado citando o anterior`;

function isSimilar(ticket: TicketRecord, search: DuplicateSearch): boolean {
  if (ticket.category === search.category) {
    return true;
  }
  return areTextsSimilar(`${ticket.title} ${ticket.description}`, search.text);
}

function toSummary(ticket: TicketRecord): TicketSummary {
  return ticketSummarySchema.parse(ticket);
}

type DescribedGroups = {
  openMatches: TicketRecord[];
  reopenable: TicketRecord[];
  expiredResolved: TicketRecord[];
  now: Date;
};

function isResolved(ticket: TicketRecord): boolean {
  return ticket.status === 'resolved' && ticket.resolvedAt !== null;
}

function formatDays(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}

export class DuplicateFinder {
  constructor(private readonly reopenPolicy: ReopenPolicy) {}

  find(search: DuplicateSearch): DuplicateCheck {
    const similar = search.tickets
      .filter((ticket: TicketRecord) => ticket.requesterId === search.requesterId)
      .filter((ticket: TicketRecord) => isSimilar(ticket, search));
    const openMatches = similar.filter((ticket: TicketRecord) => ticket.status !== 'resolved');
    const resolved = similar.filter(isResolved);
    const reopenable = resolved.filter((ticket: TicketRecord) => this.isReopenable(ticket, search));
    const expiredResolved = resolved.filter((ticket: TicketRecord) => !reopenable.includes(ticket));
    return {
      openMatches: openMatches.map(toSummary),
      reopenable: reopenable.map(toSummary),
      expiredResolved: expiredResolved.map(toSummary),
      rule: this.describe({ openMatches, reopenable, expiredResolved, now: search.now }),
    };
  }

  private isReopenable(ticket: TicketRecord, search: DuplicateSearch): boolean {
    if (ticket.resolvedAt === null) {
      return false;
    }
    return this.reopenPolicy.canReopen(new Date(ticket.resolvedAt), search.now);
  }

  private describe(groups: DescribedGroups): string {
    if (groups.openMatches.length > 0) {
      return OPEN_MATCH_RULE;
    }
    const [firstReopenable] = groups.reopenable;
    if (firstReopenable?.resolvedAt) {
      const days = this.reopenPolicy.daysSinceResolution(
        new Date(firstReopenable.resolvedAt),
        groups.now,
      );
      return `chamado resolvido há ${formatDays(days)}: pode ser reaberto`;
    }
    return groups.expiredResolved.length > 0 ? EXPIRED_RULE : NO_MATCH_RULE;
  }
}
