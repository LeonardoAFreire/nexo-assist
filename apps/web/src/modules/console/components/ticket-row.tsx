import type { TicketSummary } from '@nexo/contracts';
import { categoryLabels } from '@/components/tickets/labels';
import { OverdueLabel } from '@/components/tickets/overdue-label';
import { PriorityBadge } from '@/components/tickets/priority-badge';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import { formatDateTime } from '@/lib/format-date-time';

type TicketRowProps = {
  ticket: TicketSummary;
};

export function TicketRow({ ticket }: TicketRowProps) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-rule bg-paper p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-ink-2">{ticket.number}</span>
        <TicketStatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        {ticket.overdue ? <OverdueLabel /> : null}
      </div>
      <p className="text-[13.5px] font-semibold text-ink">{ticket.title}</p>
      <p className="text-xs text-ink-3">{categoryLabels[ticket.category]}</p>
      {ticket.latestEvent ? (
        <p className="text-xs text-ink-2">
          {ticket.latestEvent.label} · {formatDateTime(ticket.latestEvent.at)}
        </p>
      ) : null}
    </li>
  );
}
