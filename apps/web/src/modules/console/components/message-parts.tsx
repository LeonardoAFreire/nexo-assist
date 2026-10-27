import type { MessagePart } from '@nexo/contracts';
import { TicketCard } from '@/components/tickets/ticket-card';

type MessagePartsProps = {
  parts: MessagePart[];
};

function PartView({ part }: { part: MessagePart }) {
  if (part.type === 'ticket_card') {
    return <TicketCard ticket={part.ticket} />;
  }
  if (part.type === 'article_citation') {
    return <p className="text-xs text-ink-3">Artigo consultado: {part.title}</p>;
  }
  return null;
}

export function MessageParts({ parts }: MessagePartsProps) {
  return (
    <>
      {parts.map((part: MessagePart, index: number) => (
        <PartView key={`${part.type}-${index}`} part={part} />
      ))}
    </>
  );
}
