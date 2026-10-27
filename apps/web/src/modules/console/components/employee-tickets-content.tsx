import type { ConsoleEmployeeTickets } from '@nexo/contracts';
import { TicketsSection } from './tickets-section.js';

const EMPTY_MESSAGE = 'Este funcionário não tem chamados.';

type EmployeeTicketsContentProps = {
  tickets: ConsoleEmployeeTickets;
};

export function EmployeeTicketsContent({ tickets }: EmployeeTicketsContentProps) {
  const { fromConversation, others } = tickets;
  const total = fromConversation.length + others.open.length + others.closed.length;
  if (total === 0) {
    return <p className="text-[13px] text-ink-3">{EMPTY_MESSAGE}</p>;
  }
  return (
    <>
      <TicketsSection title="Desta conversa" tickets={fromConversation} />
      <TicketsSection title="Outros chamados abertos" tickets={others.open} />
      <TicketsSection title="Chamados encerrados" tickets={others.closed} />
    </>
  );
}
