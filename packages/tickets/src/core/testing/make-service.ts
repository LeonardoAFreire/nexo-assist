import { TicketsService } from '../tickets-service.js';
import { FakeClock } from './fake-clock.js';
import { InMemoryTicketRepository } from './in-memory-ticket-repository.js';
import { TEST_NOW } from './ticket-factories.js';

export function makeService() {
  const repository = new InMemoryTicketRepository();
  const clock = new FakeClock(TEST_NOW);
  const service = new TicketsService(repository, clock);
  return { repository, clock, service };
}
