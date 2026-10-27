import type { TicketScope, TicketSummary, TicketsApi } from '@nexo/contracts';

export class FakeTicketsReader implements Pick<TicketsApi, 'listOwn'> {
  readonly requests: { requesterId: string; scope: TicketScope }[] = [];

  constructor(private readonly byRequester: Record<string, TicketSummary[]>) {}

  async listOwn(input: { requesterId: string; scope: TicketScope }): Promise<TicketSummary[]> {
    this.requests.push(input);
    return this.byRequester[input.requesterId] ?? [];
  }
}
