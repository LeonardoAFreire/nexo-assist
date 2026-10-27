import type { PendingAction } from '@nexo/contracts';
import { usePendingAction } from '../hooks/use-pending-action.js';
import { ActionFrame } from './action-frame.js';

type ReopenCardProps = {
  action: PendingAction;
};

export function ReopenCard({ action }: ReopenCardProps) {
  const api = usePendingAction(action);
  return (
    <ActionFrame action={action} api={api} onEdit={null}>
      <h3 className="text-[15px] font-semibold text-ink">Reabrir {action.targetNumber}</h3>
      <p className="text-sm whitespace-pre-wrap text-ink-2">Motivo: {action.complement}</p>
    </ActionFrame>
  );
}
