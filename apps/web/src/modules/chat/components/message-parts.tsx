import type { MessagePart } from '@nexo/contracts';
import { TicketCard } from '@/components/tickets/ticket-card';
import { ArticleCitation } from './article-citation.js';

type MessagePartsProps = {
  parts: MessagePart[];
};

function PartView({ part }: { part: MessagePart }) {
  switch (part.type) {
    case 'ticket_card':
      return <TicketCard ticket={part.ticket} />;
    case 'article_citation':
      return <ArticleCitation part={part} />;
    default:
      return null;
  }
}

export function MessageParts({ parts }: MessagePartsProps) {
  return parts.map((part: MessagePart, index: number) => (
    <PartView key={`${part.type}-${index}`} part={part} />
  ));
}
