import type { TicketType } from '@nexo/contracts';
import type { TicketRecord } from '../core/ticket-record.js';
import type {
  RequesterIdempotencyKey,
  RequesterSearch,
  RequesterTicketKey,
  TicketRepository,
  TicketSave,
} from '../core/ticket-repository.js';
import type { OutageWindow } from './outage-window.js';

export class LegacyOutageSimulator implements TicketRepository {
  constructor(
    private readonly inner: TicketRepository,
    private readonly outage: OutageWindow,
  ) {}

  async listByRequester(requesterId: string): Promise<TicketRecord[]> {
    this.outage.ensureAvailable();
    return this.inner.listByRequester(requesterId);
  }

  async search(input: RequesterSearch): Promise<TicketRecord[]> {
    this.outage.ensureAvailable();
    return this.inner.search(input);
  }

  async findByNumber(input: RequesterTicketKey): Promise<TicketRecord | null> {
    this.outage.ensureAvailable();
    return this.inner.findByNumber(input);
  }

  async findByIdempotencyKey(input: RequesterIdempotencyKey): Promise<TicketRecord | null> {
    this.outage.ensureAvailable();
    return this.inner.findByIdempotencyKey(input);
  }

  async save(input: TicketSave): Promise<void> {
    this.outage.ensureAvailable();
    return this.inner.save(input);
  }

  async nextSequence(type: TicketType): Promise<number> {
    this.outage.ensureAvailable();
    return this.inner.nextSequence(type);
  }
}
