import type { PriorityDeadline, TicketPriority } from '@nexo/contracts';
import { addHours } from 'date-fns';
import {
  BUSINESS_HOURS_PER_BUSINESS_DAY,
  type ServiceDeskCalendar,
} from './service-desk-calendar.js';

const CONTACT_BUSINESS_HOURS = 2;
const CRITICAL_CONTACT_CLOCK_HOURS = 1;

const DEADLINES: Record<TicketPriority, PriorityDeadline> = {
  critical: { amount: 1, unit: 'clock_hours' },
  high: { amount: 4, unit: 'business_hours' },
  medium: { amount: 3, unit: 'business_days' },
  low: { amount: 5, unit: 'business_days' },
};

type DueAtInput = {
  priority: TicketPriority;
  from: Date;
};

type ContactDueAtInput = {
  from: Date;
  critical: boolean;
};

export class DeadlinePolicy {
  constructor(private readonly calendar: ServiceDeskCalendar) {}

  deadlineFor(priority: TicketPriority): PriorityDeadline {
    return DEADLINES[priority];
  }

  dueAt(input: DueAtInput): Date {
    const { amount, unit } = this.deadlineFor(input.priority);
    if (unit === 'clock_hours') {
      return addHours(input.from, amount);
    }
    const hoursPerUnit = unit === 'business_days' ? BUSINESS_HOURS_PER_BUSINESS_DAY : 1;
    return this.calendar.addBusinessHours(input.from, amount * hoursPerUnit);
  }

  contactDueAt(input: ContactDueAtInput): Date {
    if (input.critical) {
      return addHours(input.from, CRITICAL_CONTACT_CLOCK_HOURS);
    }
    return this.calendar.addBusinessHours(input.from, CONTACT_BUSINESS_HOURS);
  }
}
