import type { TicketPriority, TicketStatus } from '@nexo/contracts';
import type { DeadlinePolicy } from './deadline-policy.js';

export type OverdueSubject = {
  priority: TicketPriority;
  status: TicketStatus;
  lastUpdatedAt: Date;
};

export class OverduePolicy {
  constructor(private readonly deadlines: DeadlinePolicy) {}

  dueAt(subject: OverdueSubject): Date | null {
    if (subject.status === 'resolved') {
      return null;
    }
    return this.deadlines.dueAt({ priority: subject.priority, from: subject.lastUpdatedAt });
  }

  isOverdue(subject: OverdueSubject, now: Date): boolean {
    const dueAt = this.dueAt(subject);
    return dueAt !== null && now.getTime() > dueAt.getTime();
  }
}
