import type { TicketSelectionPart, TicketSummary } from '@nexo/contracts';
import { TicketCard } from '@/components/tickets/ticket-card';
import { useChatActions } from '../hooks/chat-actions-context.js';
import { TicketChoice } from './ticket-choice.js';

type TicketSelectionProps = {
  messageId: string | null;
  part: TicketSelectionPart;
};

export function TicketSelection({ messageId, part }: TicketSelectionProps) {
  const { busy, reply } = useChatActions();
  const selected = part.tickets.find((ticket) => ticket.number === part.selectedNumber);
  if (selected) {
    return <TicketCard ticket={selected} />;
  }
  const choose = (ticket: TicketSummary): void => {
    if (messageId) {
      const selection = { messageId, number: ticket.number };
      reply({ text: ticket.number, quickReply: null, ticketSelection: selection });
    }
  };
  return (
    <ul aria-label="Escolha um chamado" className="flex flex-col gap-2">
      {part.tickets.map((ticket: TicketSummary) => (
        <li key={ticket.number}>
          <TicketChoice ticket={ticket} disabled={busy || messageId === null} onChoose={choose} />
        </li>
      ))}
    </ul>
  );
}
