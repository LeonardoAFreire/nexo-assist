import type { PendingAction } from '@nexo/contracts';
import { ComplementCard } from './complement-card.js';
import { DraftCard } from './draft-card.js';
import { ReopenCard } from './reopen-card.js';
import { ResolvedAction } from './resolved-action.js';

type PendingActionCardProps = {
  action: PendingAction;
};

export function PendingActionCard({ action }: PendingActionCardProps) {
  if (action.status !== 'pending') {
    return <ResolvedAction action={action} />;
  }
  if (action.kind === 'complement_ticket') {
    return <ComplementCard action={action} />;
  }
  if (action.kind === 'reopen_ticket') {
    return <ReopenCard action={action} />;
  }
  return action.draft ? <DraftCard action={action} draft={action.draft} /> : null;
}
