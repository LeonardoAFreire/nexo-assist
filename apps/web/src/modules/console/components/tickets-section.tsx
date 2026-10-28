import type { TicketSummary } from '@nexo/contracts';
import type { ComponentType } from 'react';

type TicketRowComponent = ComponentType<{ ticket: TicketSummary }>;

type TicketsSectionProps = {
  title: string;
  tickets: TicketSummary[];
  Row: TicketRowComponent;
};

export function TicketsSection({ title, tickets, Row }: TicketsSectionProps) {
  if (tickets.length === 0) {
    return null;
  }
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h3 className="text-[12.5px] font-semibold text-ink-3">{title}</h3>
      <ul className="flex flex-col">
        {tickets.map((ticket: TicketSummary) => (
          <Row key={ticket.number} ticket={ticket} />
        ))}
      </ul>
    </section>
  );
}
