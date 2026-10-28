import type { TicketSelectionPart, TicketSummary } from '@nexo/contracts';
import { CardShell } from '@/components/tickets/card-shell';
import { useChatActions } from '../hooks/chat-actions-context.js';
import { TicketChoice } from './ticket-choice.js';

type TicketSelectionProps = {
  messageId: string | null;
  part: TicketSelectionPart;
};

function selectionText(ticket: TicketSummary): string {
  return `${ticket.number} · ${ticket.title}`;
}

export function TicketSelection({ messageId, part }: TicketSelectionProps) {
  const { busy, reply } = useChatActions();
  const answered = part.selectedNumber !== null;
  const choose = (ticket: TicketSummary): void => {
    if (messageId) {
      const selection = { messageId, number: ticket.number };
      reply({ text: selectionText(ticket), quickReply: null, ticketSelection: selection });
    }
  };
  return (
    <CardShell>
      <ul aria-label="Escolha um chamado" className="divide-y divide-rule">
        {part.tickets.map((ticket: TicketSummary) => (
          <li key={ticket.number}>
            <TicketChoice
              ticket={ticket}
              selected={ticket.number === part.selectedNumber}
              disabled={busy || answered || messageId === null}
              onChoose={choose}
            />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
