import type { TicketSummary } from '@nexo/contracts';
import { OverdueLabel } from '@/components/tickets/overdue-label';
import { PriorityBadge } from '@/components/tickets/priority-badge';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import { formatDate } from '@/lib/format-date-time';

type TicketChoiceProps = {
  ticket: TicketSummary;
  disabled: boolean;
  onChoose: (ticket: TicketSummary) => void;
};

export function TicketChoice({ ticket, disabled, onChoose }: TicketChoiceProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChoose(ticket)}
      className="flex w-full max-w-[600px] flex-col gap-1.5 rounded-xl border border-rule bg-paper px-4 py-3 text-left transition-colors outline-none hover:bg-desk focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-ink-2">{ticket.number}</span>
        <TicketStatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        {ticket.overdue ? <OverdueLabel /> : null}
      </span>
      <span className="text-sm font-medium text-ink">{ticket.title}</span>
      <time dateTime={ticket.lastUpdatedAt} className="text-xs text-ink-3">
        Atualizado em {formatDate(ticket.lastUpdatedAt)}
      </time>
    </button>
  );
}
