import type { TicketDraft, TicketsApi } from '@nexo/contracts';

export async function reassessDraft(
  tickets: Pick<TicketsApi, 'assessPriority'>,
  draft: TicketDraft,
): Promise<TicketDraft> {
  const assessment = await tickets.assessPriority(draft.priorityFacts);
  return {
    ...draft,
    priority: assessment.priority,
    dueAt: assessment.dueAt,
    rule: assessment.rule,
  };
}
