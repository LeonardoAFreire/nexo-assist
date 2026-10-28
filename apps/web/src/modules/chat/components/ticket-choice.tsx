import type { TicketSummary } from '@nexo/contracts';
import { statusLabels } from '@/components/tickets/labels';
import { StatusDot } from '@/components/tickets/status-dot';
import { statusDotClass } from '@/components/tickets/ticket-tones';
import { formatShortDate } from '@/lib/format-date-time';
import { cn } from '@/lib/utils';

type TicketChoiceProps = {
  ticket: TicketSummary;
  selected: boolean;
  disabled: boolean;
  onChoose: (ticket: TicketSummary) => void;
};

const CHOICE_CLASS =
  'group flex h-[46px] w-full items-center gap-3.5 px-4 text-left transition-colors duration-200 outline-none hover:bg-cta/4 focus-visible:bg-cta/4 focus-visible:ring-2 focus-visible:ring-cta/30 focus-visible:ring-inset disabled:cursor-not-allowed';

const RADIO_CLASS =
  'size-4 shrink-0 rounded-full border-[1.5px] border-ink/20 bg-paper transition-[border-width,border-color] duration-200 group-hover:border-[5px] group-hover:border-cta group-focus-visible:border-[5px] group-focus-visible:border-cta';

function ChoiceRadio({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden="true" className={cn(RADIO_CLASS, selected && 'border-[5px] border-cta')} />
  );
}

export function TicketChoice({ ticket, selected, disabled, onChoose }: TicketChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onChoose(ticket)}
      className={cn(
        CHOICE_CLASS,
        selected ? 'bg-cta/4 disabled:opacity-100' : 'disabled:opacity-60',
      )}
    >
      <ChoiceRadio selected={selected} />
      <span className="text-[12.5px] font-medium text-ink-3">{ticket.number}</span>
      <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink">
        {ticket.title}
      </span>
      <span className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
        <StatusDot className={statusDotClass[ticket.status]} />
        {statusLabels[ticket.status]}
      </span>
      <time dateTime={ticket.lastUpdatedAt} className="w-11 text-right text-[12.5px] text-ink-3">
        {formatShortDate(ticket.lastUpdatedAt)}
      </time>
    </button>
  );
}
