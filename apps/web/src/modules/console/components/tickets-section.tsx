import type { TicketSummary } from '@nexo/contracts';
import { TicketRow } from './ticket-row.js';

type TicketsSectionProps = {
  title: string;
  tickets: TicketSummary[];
};

export function TicketsSection({ title, tickets }: TicketsSectionProps) {
  if (tickets.length === 0) {
    return null;
  }
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{title}</h3>
      <ul className="flex flex-col gap-2">
        {tickets.map((ticket: TicketSummary) => (
          <TicketRow key={ticket.number} ticket={ticket} />
        ))}
      </ul>
    </section>
  );
}
