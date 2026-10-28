import type { ConsoleEmployeeTickets } from '@nexo/contracts';
import { CurrentTicket, OtherTicket } from './ticket-row.js';
import { TicketsSection } from './tickets-section.js';

const EMPTY_MESSAGE = 'Este funcionário não tem chamados.';

type EmployeeTicketsContentProps = {
  tickets: ConsoleEmployeeTickets;
};

export function EmployeeTicketsContent({ tickets }: EmployeeTicketsContentProps) {
  const { fromConversation, others } = tickets;
  const otherTickets = [...others.open, ...others.closed];
  if (fromConversation.length + otherTickets.length === 0) {
    return <p className="text-[13px] text-ink-3">{EMPTY_MESSAGE}</p>;
  }
  return (
    <>
      <TicketsSection title="Desta conversa" tickets={fromConversation} Row={CurrentTicket} />
      <TicketsSection title="Outros chamados" tickets={otherTickets} Row={OtherTicket} />
    </>
  );
}
