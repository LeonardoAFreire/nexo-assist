import type { TicketPriority, TicketStatus } from '@nexo/contracts';

export const statusDotClass: Record<TicketStatus, string> = {
  open: 'bg-ink/40',
  awaiting_analyst: 'bg-warning',
  in_progress: 'bg-primary',
  in_service: 'bg-primary',
  approved: 'bg-success',
  resolved: 'bg-success',
};

export const statusTextClass: Record<TicketStatus, string> = {
  open: 'text-ink-3',
  awaiting_analyst: 'text-warning-text',
  in_progress: 'text-primary-text',
  in_service: 'text-primary-text',
  approved: 'text-success-text',
  resolved: 'text-success-text',
};

export const priorityDotClass: Record<TicketPriority, string> = {
  critical: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-ink/40',
  low: 'bg-ink/20',
};
