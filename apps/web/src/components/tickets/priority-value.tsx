import type { TicketPriority } from '@nexo/contracts';
import { priorityLabels } from './labels.js';
import { StatusDot } from './status-dot.js';
import { priorityDotClass } from './ticket-tones.js';

type PriorityValueProps = {
  priority: TicketPriority;
};

export function PriorityValue({ priority }: PriorityValueProps) {
  return (
    <>
      <StatusDot className={priorityDotClass[priority]} />
      {priorityLabels[priority]}
    </>
  );
}
