import type { ConversationHandedOffPayload } from '@nexo/contracts';
import { ComplementTicket, type ComplementTicketInput } from './complement-ticket.js';
import { CreateTicket, type CreateTicketInput } from './create-ticket.js';
import { RecordHandoff } from './record-handoff.js';
import { ReopenTicket, type ReopenTicketInput } from './reopen-ticket.js';
import type { TicketRecord } from './ticket-record.js';
import type { TicketWriteDeps } from './ticket-write-deps.js';

export class TicketWrites {
  private readonly createTicket: CreateTicket;
  private readonly complementTicket: ComplementTicket;
  private readonly reopenTicket: ReopenTicket;
  private readonly handoffRecorder: RecordHandoff;

  constructor(deps: TicketWriteDeps) {
    this.createTicket = new CreateTicket(deps);
    this.complementTicket = new ComplementTicket(deps);
    this.reopenTicket = new ReopenTicket(deps);
    this.handoffRecorder = new RecordHandoff(deps);
  }

  create(input: CreateTicketInput): Promise<TicketRecord> {
    return this.createTicket.execute(input);
  }

  complement(input: ComplementTicketInput): Promise<TicketRecord> {
    return this.complementTicket.execute(input);
  }

  reopen(input: ReopenTicketInput): Promise<TicketRecord> {
    return this.reopenTicket.execute(input);
  }

  recordHandoff(handoff: ConversationHandedOffPayload): Promise<void> {
    return this.handoffRecorder.execute(handoff);
  }
}
