import type { TicketDetail, TicketSummary } from '@nexo/contracts';
import { formatDateTime } from '@/lib/format-date-time';
import { categoryLabels } from './labels.js';
import { OverdueLabel } from './overdue-label.js';
import { PriorityBadge } from './priority-badge.js';
import { TicketMeta } from './ticket-meta.js';
import { TicketStatusBadge } from './ticket-status-badge.js';

type TicketCardProps = {
  ticket: TicketSummary | TicketDetail;
};

export function TicketCard({ ticket }: TicketCardProps) {
  const headingId = `ticket-${ticket.number}`;
  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-2xl border border-rule bg-paper p-4 shadow-sm"
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-ink-2">{ticket.number}</span>
        <TicketStatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        {ticket.overdue ? <OverdueLabel /> : null}
      </header>
      <h3 id={headingId} className="text-[15px] font-semibold text-ink">
        {ticket.title}
      </h3>
      {'description' in ticket ? <p className="text-sm text-ink-2">{ticket.description}</p> : null}
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <TicketMeta term="Categoria" value={categoryLabels[ticket.category]} />
        <TicketMeta term="Aberto em" value={formatDateTime(ticket.openedAt)} />
        <TicketMeta term="Atualizado em" value={formatDateTime(ticket.lastUpdatedAt)} />
      </dl>
    </article>
  );
}
