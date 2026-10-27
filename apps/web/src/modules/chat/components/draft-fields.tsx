import type { TicketDraft } from '@nexo/contracts';
import { categoryLabels } from '@/components/tickets/labels';
import { PriorityBadge } from '@/components/tickets/priority-badge';
import { TicketMeta } from '@/components/tickets/ticket-meta';
import { formatDateTime } from '@/lib/format-date-time';
import { affectedLabels } from './affected-labels.js';

type DraftFieldsProps = {
  draft: TicketDraft;
};

export function DraftFields({ draft }: DraftFieldsProps) {
  return (
    <>
      <h3 className="text-[15px] font-semibold text-ink">{draft.title}</h3>
      <p className="text-sm text-ink-2">{draft.description}</p>
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <TicketMeta term="Categoria" value={categoryLabels[draft.category]} />
        <TicketMeta term="Afetados" value={affectedLabels[draft.affected]} />
      </dl>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <PriorityBadge priority={draft.priority} />
        <span className="text-xs text-ink-2">Resposta até {formatDateTime(draft.dueAt)}</span>
      </div>
      <p className="text-xs text-ink-3">{draft.rule}</p>
    </>
  );
}
