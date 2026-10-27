import type { Clock } from './clock.js';
import { DeadlinePolicy } from './deadline-policy.js';
import { DuplicateFinder } from './duplicate-finder.js';
import { OverduePolicy } from './overdue-policy.js';
import { PriorityAssessor } from './priority-assessor.js';
import { PriorityMatrix } from './priority-matrix.js';
import { ReopenPolicy } from './reopen-policy.js';
import { ServiceDeskCalendar } from './service-desk-calendar.js';

export type TicketRules = {
  assessor: PriorityAssessor;
  deadlines: DeadlinePolicy;
  overdue: OverduePolicy;
  reopen: ReopenPolicy;
  duplicates: DuplicateFinder;
};

export function createTicketRules(clock: Clock): TicketRules {
  const deadlines = new DeadlinePolicy(new ServiceDeskCalendar());
  const reopen = new ReopenPolicy();
  return {
    assessor: new PriorityAssessor(new PriorityMatrix(), deadlines, clock),
    deadlines,
    overdue: new OverduePolicy(deadlines),
    reopen,
    duplicates: new DuplicateFinder(reopen),
  };
}
