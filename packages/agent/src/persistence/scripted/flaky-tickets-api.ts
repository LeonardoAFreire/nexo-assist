import { type TicketDetail, type TicketsApi, TicketsUnavailableError } from '@nexo/contracts';
import { InMemoryTicketsApi, type OwnedTicket } from './in-memory-tickets-api.js';

export class FlakyTicketsApi extends InMemoryTicketsApi {
  private remainingFailures: number;

  constructor(owned: OwnedTicket[], failures: number) {
    super(owned);
    this.remainingFailures = failures;
  }

  override async listOwn(input: Parameters<TicketsApi['listOwn']>[0]): Promise<TicketDetail[]> {
    this.failWhileOutage();
    return super.listOwn(input);
  }

  override async findOwn(
    input: Parameters<TicketsApi['findOwn']>[0],
  ): Promise<TicketDetail | null> {
    this.failWhileOutage();
    return super.findOwn(input);
  }

  override async searchOwn(input: Parameters<TicketsApi['searchOwn']>[0]): Promise<TicketDetail[]> {
    this.failWhileOutage();
    return super.searchOwn(input);
  }

  private failWhileOutage(): void {
    if (this.remainingFailures === 0) {
      return;
    }
    this.remainingFailures -= 1;
    throw new TicketsUnavailableError();
  }
}
