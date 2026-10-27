import type { PendingAction } from '@nexo/contracts';
import { actionStatusLabels } from './affected-labels.js';
import { actionTitle } from './action-title.js';

type ResolvedActionProps = {
  action: PendingAction;
};

export function ResolvedAction({ action }: ResolvedActionProps) {
  const ticketNumber = action.resultTicket?.number;
  const suffix = ticketNumber ? ` · ${ticketNumber}` : '';
  return (
    <p className="w-fit rounded-xl border border-rule bg-desk px-3 py-2 text-xs font-medium text-ink-2">
      {`${actionTitle(action)} · ${actionStatusLabels[action.status]}${suffix}`}
    </p>
  );
}
