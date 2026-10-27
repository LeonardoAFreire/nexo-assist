import type { Clock } from './clock.js';
import type { TicketRepository } from './ticket-repository.js';
import type { TicketRules } from './ticket-rules.js';

export type TicketWriteDeps = {
  repository: TicketRepository;
  clock: Clock;
  rules: TicketRules;
};
