import type { TicketAffected, TicketCategory, TicketPriority, TicketStatus } from '@nexo/contracts';

export type EvalTicketSpec = {
  number: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  owner: string;
  openedDaysAgo: number;
  updatedDaysAgo: number;
  overdue?: boolean;
  affected?: TicketAffected;
};
