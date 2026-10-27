import type { TicketStatus } from '@nexo/contracts';
import { cn } from '@/lib/utils';
import { statusLabels } from './labels.js';

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-desk text-ink-2',
  awaiting_analyst: 'bg-warning/15 text-ink-2',
  in_progress: 'bg-primary-soft text-primary-text',
  in_service: 'bg-primary-soft text-primary-text',
  approved: 'bg-success-soft text-success-text',
  resolved: 'bg-success-soft text-success-text',
};

type TicketStatusBadgeProps = {
  status: TicketStatus;
};

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const className = cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[status]);
  return <span className={className}>{statusLabels[status]}</span>;
}
