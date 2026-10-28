import type { TicketDraft } from '@nexo/contracts';
import { CardDescription, CardTitle } from '@/components/tickets/card-body';
import { CardField, CardFields } from '@/components/tickets/card-fields';
import { categoryLabels } from '@/components/tickets/labels';
import { PriorityValue } from '@/components/tickets/priority-value';
import { formatDueTime } from '@/lib/format-date-time';
import { affectedLabels } from './affected-labels.js';

type DraftProps = {
  draft: TicketDraft;
};

export function DraftBody({ draft }: DraftProps) {
  return (
    <>
      <CardTitle>{draft.title}</CardTitle>
      <CardDescription>{draft.description}</CardDescription>
      <p className="pt-1 text-[12.5px] text-ink-3">{draft.rule}</p>
    </>
  );
}

export function DraftFields({ draft }: DraftProps) {
  return (
    <CardFields>
      <CardField label="Categoria">{categoryLabels[draft.category]}</CardField>
      <CardField label="Prioridade">
        <PriorityValue priority={draft.priority} />
        <span className="text-[13.5px] font-normal text-ink-3">
          · resposta até {formatDueTime(draft.dueAt)}
        </span>
      </CardField>
      <CardField label="Afetados">{affectedLabels[draft.affected]}</CardField>
    </CardFields>
  );
}
