import { ticketDetailSchema, ticketSummarySchema } from '@nexo/contracts';
import type { TicketDetail, TicketSummary } from '@nexo/contracts';
import type { Clock } from './clock.js';
import type { OverduePolicy } from './overdue-policy.js';
import type { TicketRecord } from './ticket-record.js';

export class TicketPresenter {
  constructor(
    private readonly overdue: OverduePolicy,
    private readonly clock: Clock,
  ) {}

  summary(record: TicketRecord): TicketSummary {
    return ticketSummarySchema.parse(this.withDeadline(record));
  }

  detail(record: TicketRecord): TicketDetail {
    return ticketDetailSchema.parse(this.withDeadline(record));
  }

  private withDeadline(record: TicketRecord): TicketRecord {
    const subject = { ...record, lastUpdatedAt: new Date(record.lastUpdatedAt) };
    const dueAt = this.overdue.dueAt(subject);
    return {
      ...record,
      dueAt: dueAt === null ? null : dueAt.toISOString(),
      overdue: this.overdue.isOverdue(subject, this.clock.now()),
    };
  }
}
