import type { MessagePart } from '@nexo/contracts';
import { TicketCard } from '@/components/tickets/ticket-card';
import { cn } from '@/lib/utils';
import { ArticleCitation } from './article-citation.js';
import { PendingActionCard } from './pending-action-card.js';
import { QuickOptions } from './quick-options.js';
import { TicketSelection } from './ticket-selection.js';

type MessagePartsProps = {
  messageId: string | null;
  parts: MessagePart[];
  animate?: boolean;
};

type PartViewProps = {
  messageId: string | null;
  part: MessagePart;
};

function PartView({ messageId, part }: PartViewProps) {
  switch (part.type) {
    case 'ticket_card':
      return <TicketCard ticket={part.ticket} />;
    case 'article_citation':
      return <ArticleCitation part={part} />;
    case 'quick_options':
      return <QuickOptions messageId={messageId} part={part} />;
    case 'ticket_selection':
      return <TicketSelection messageId={messageId} part={part} />;
    case 'pending_action':
      return <PendingActionCard action={part.action} />;
    case 'event':
      return <p className="text-center text-xs font-medium text-ink-3">{part.label}</p>;
  }
}

export function MessageParts({ messageId, parts, animate = false }: MessagePartsProps) {
  return parts.map((part: MessagePart, index: number) => (
    <div key={`${part.type}-${index}`} className={cn(animate && 'motion-safe:animate-rise')}>
      <PartView messageId={messageId} part={part} />
    </div>
  ));
}
