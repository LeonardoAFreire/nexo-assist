import type { PendingAction } from '@nexo/contracts';
import { CardDescription, CardTitle } from '@/components/tickets/card-body';
import { usePendingAction } from '../hooks/use-pending-action.js';
import { ActionFrame } from './action-frame.js';

type ComplementCardProps = {
  action: PendingAction;
};

export function ComplementCard({ action }: ComplementCardProps) {
  const api = usePendingAction(action);
  return (
    <ActionFrame action={action} api={api} onEdit={null}>
      <CardTitle>Complemento para {action.targetNumber}</CardTitle>
      <CardDescription>{action.complement}</CardDescription>
    </ActionFrame>
  );
}
