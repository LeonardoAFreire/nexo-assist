import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { Conversation } from '../conversation/conversation.js';
import type { PendingActionRecord } from './pending-action-record.js';
import type { PendingActionRepository } from './pending-action-repository.js';

const NOT_FOUND_MESSAGE = 'Ação não encontrada.';
const NOT_PENDING_MESSAGE = 'Esta ação já foi confirmada, cancelada ou substituída.';

export type PendingActionTarget = {
  conversation: Conversation;
  actionId: string;
};

export async function requirePendingAction(
  repository: Pick<PendingActionRepository, 'findById'>,
  target: PendingActionTarget,
): Promise<PendingActionRecord> {
  const record = await repository.findById(target.actionId);
  if (record === null || record.conversationId !== target.conversation.id) {
    throw new ChatRuleError('not_found', NOT_FOUND_MESSAGE);
  }
  if (record.status !== 'pending') {
    throw new ChatRuleError('pending_action_not_pending', NOT_PENDING_MESSAGE);
  }
  return record;
}
