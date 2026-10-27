import type { TicketType } from '@nexo/contracts';
import type { TicketRepository } from './ticket-repository.js';

const NUMBER_DIGITS = 5;

export const INITIAL_SEQUENCES: Record<TicketType, number> = {
  incident: 20520,
  request: 10450,
};

const PREFIXES: Record<TicketType, string> = {
  incident: 'INC',
  request: 'REQ',
};

export class TicketNumberGenerator {
  constructor(private readonly repository: Pick<TicketRepository, 'nextSequence'>) {}

  async next(type: TicketType): Promise<string> {
    const sequence = await this.repository.nextSequence(type);
    return `${PREFIXES[type]}-${String(sequence).padStart(NUMBER_DIGITS, '0')}`;
  }
}
