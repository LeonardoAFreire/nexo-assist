import type { TicketPriority } from '@nexo/contracts';
import { cn } from '@/lib/utils';
import { priorityLabels } from './labels.js';

const priorityStyles: Record<TicketPriority, string> = {
  critical: 'bg-destructive/10 text-destructive',
  high: 'bg-warning/15 text-ink-2',
  medium: 'bg-primary-soft text-primary-text',
  low: 'bg-desk text-ink-3',
};

type PriorityBadgeProps = {
  priority: TicketPriority;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const className = cn('rounded-full px-2.5 py-0.5 text-xs font-medium', priorityStyles[priority]);
  return <span className={className}>Prioridade {priorityLabels[priority].toLowerCase()}</span>;
}
