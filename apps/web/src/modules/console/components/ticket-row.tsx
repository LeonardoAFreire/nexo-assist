import type { TicketSummary } from '@nexo/contracts';
import { ArrowRightLeft } from 'lucide-react';
import { categoryLabels, priorityLabels, statusLabels } from '@/components/tickets/labels';
import { StatusDot } from '@/components/tickets/status-dot';
import { statusDotClass, statusTextClass } from '@/components/tickets/ticket-tones';
import { formatShortDate } from '@/lib/format-date-time';
import { cn } from '@/lib/utils';
import { formatClockTime } from './format-clock-time.js';

type TicketRowProps = {
  ticket: TicketSummary;
};

function stateLine(ticket: TicketSummary): string {
  if (ticket.resolvedAt) {
    return `${ticket.number} · Resolvido em ${formatShortDate(ticket.resolvedAt)}`;
  }
  return `${ticket.number} · ${statusLabels[ticket.status]}`;
}

function TicketNumberRow({ ticket }: TicketRowProps) {
  return (
    <div className="flex items-center">
      <span className="flex-1 text-[12.5px] font-medium text-ink-3">{ticket.number}</span>
      <span
        className={cn(
          'flex items-center gap-1.5 text-[12.5px] font-semibold',
          statusTextClass[ticket.status],
        )}
      >
        <StatusDot className={statusDotClass[ticket.status]} />
        {statusLabels[ticket.status]}
      </span>
    </div>
  );
}

export function CurrentTicket({ ticket }: TicketRowProps) {
  const meta = `${categoryLabels[ticket.category]} · prioridade ${priorityLabels[ticket.priority].toLowerCase()}`;
  return (
    <li className="flex flex-col gap-3.5 rounded-xl bg-desk p-4">
      <div className="flex flex-col gap-1.5">
        <TicketNumberRow ticket={ticket} />
        <p className="text-[15.5px] leading-[1.3] font-semibold text-ink">{ticket.title}</p>
        <p className="text-[13.5px] text-ink-3">{meta}</p>
      </div>
      {ticket.latestEvent ? (
        <p className="flex items-center gap-2 border-t border-rule pt-3 text-[13.5px] text-ink-2">
          <ArrowRightLeft aria-hidden="true" className="size-[15px] shrink-0 text-ink-3" />
          <span className="flex-1">{ticket.latestEvent.label}</span>
          <time dateTime={ticket.latestEvent.at} className="text-[12.5px] text-ink-3">
            {formatClockTime(ticket.latestEvent.at)}
          </time>
        </p>
      ) : null}
    </li>
  );
}

export function OtherTicket({ ticket }: TicketRowProps) {
  return (
    <li className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0">
      <StatusDot className={cn('size-[7px]', statusDotClass[ticket.status])} />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="truncate text-[14.5px] font-medium text-ink">{ticket.title}</p>
        <p className="text-[12.5px] text-ink-3">{stateLine(ticket)}</p>
        {ticket.overdue ? <p className="text-[12.5px] text-danger-text">prazo vencido</p> : null}
      </div>
    </li>
  );
}
