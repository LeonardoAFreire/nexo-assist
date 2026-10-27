import type { DuplicateCheck, TicketSummary } from '@nexo/contracts';

export type DuplicateSplit = {
  blocking: TicketSummary[];
  overridden: TicketSummary[];
};

export function splitDuplicates(check: DuplicateCheck, notDuplicateOf: string[]): DuplicateSplit {
  const isOverridden = (ticket: TicketSummary): boolean => notDuplicateOf.includes(ticket.number);
  return {
    blocking: check.openMatches.filter((ticket) => !isOverridden(ticket)),
    overridden: check.openMatches.filter(isOverridden),
  };
}

export function overrideRules(overridden: TicketSummary[]): string[] {
  return overridden.map(
    (ticket) => `chamado aberto ${ticket.number} indicado como não duplicado: segue para abertura`,
  );
}
