import {
  type ChatTurnOutcome,
  chatTurnOutcomeSchema,
  type ConfirmPendingActionRequest,
  type EditPendingActionRequest,
  type PendingAction,
  pendingActionSchema,
} from '@nexo/contracts';
import { http } from '@/lib/http';

function actionPath(actionId: string): string {
  return `/conversations/current/pending-actions/${actionId}`;
}

export async function editPendingAction(
  actionId: string,
  changes: EditPendingActionRequest,
): Promise<PendingAction> {
  const response = await http.patch<unknown>(actionPath(actionId), changes);
  return pendingActionSchema.parse(response.data);
}

export async function confirmPendingAction(
  actionId: string,
  request: ConfirmPendingActionRequest,
): Promise<ChatTurnOutcome> {
  const response = await http.post<unknown>(`${actionPath(actionId)}/confirm`, request);
  return chatTurnOutcomeSchema.parse(response.data);
}

export async function cancelPendingAction(actionId: string): Promise<PendingAction> {
  const response = await http.post<unknown>(`${actionPath(actionId)}/cancel`);
  return pendingActionSchema.parse(response.data);
}
