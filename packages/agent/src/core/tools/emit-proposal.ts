import type { PendingActionKind, TicketDraft } from '@nexo/contracts';
import type { TurnContext } from '../turn-context.js';

export type Proposal = {
  kind: PendingActionKind;
  draft?: TicketDraft;
  targetNumber?: string;
  complement?: string;
};

export function emitProposal(context: TurnContext, proposal: Proposal): void {
  context.emit({
    type: 'proposal',
    kind: proposal.kind,
    draft: proposal.draft ?? null,
    targetNumber: proposal.targetNumber ?? null,
    complement: proposal.complement ?? null,
  });
}
