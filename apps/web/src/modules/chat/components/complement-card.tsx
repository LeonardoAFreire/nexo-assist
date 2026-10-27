import type { PendingAction } from '@nexo/contracts';
import { usePendingAction } from '../hooks/use-pending-action.js';
import { ActionFrame } from './action-frame.js';

type ComplementCardProps = {
  action: PendingAction;
};

export function ComplementCard({ action }: ComplementCardProps) {
  const api = usePendingAction(action);
  return (
    <ActionFrame action={action} api={api} onEdit={null}>
      <h3 className="text-[15px] font-semibold text-ink">Complemento para {action.targetNumber}</h3>
      <p className="text-sm whitespace-pre-wrap text-ink-2">{action.complement}</p>
    </ActionFrame>
  );
}
