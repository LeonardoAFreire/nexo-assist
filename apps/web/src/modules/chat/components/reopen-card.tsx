import type { PendingAction } from '@nexo/contracts';
import { CardDescription, CardTitle } from '@/components/tickets/card-body';
import { usePendingAction } from '../hooks/use-pending-action.js';
import { ActionFrame } from './action-frame.js';

type ReopenCardProps = {
  action: PendingAction;
};

export function ReopenCard({ action }: ReopenCardProps) {
  const api = usePendingAction(action);
  return (
    <ActionFrame action={action} api={api} onEdit={null}>
      <CardTitle>Reabrir {action.targetNumber}</CardTitle>
      <CardDescription>Motivo: {action.complement}</CardDescription>
    </ActionFrame>
  );
}
