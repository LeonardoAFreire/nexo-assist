import type {
  ChatMessage,
  ChatTurnOutcome,
  ConfirmationChannel,
  EditPendingActionRequest,
  PendingAction,
} from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { asConfirmationError } from '../send/turn-failure.js';
import { buildCancellationSystemMessage } from './cancellation-system-message.js';
import type { EmployeePendingActionsDeps } from './employee-pending-actions-deps.js';
import { toPendingAction } from './to-pending-action.js';

const ACTION_NOT_FOUND_MESSAGE = 'Ação não encontrada.';

export type { EmployeePendingActionsDeps };

export type EmployeeActionTarget = {
  employeeId: string;
  actionId: string;
};

export class EmployeePendingActions {
  constructor(private readonly deps: EmployeePendingActionsDeps) {}

  async edit(
    input: EmployeeActionTarget & { changes: EditPendingActionRequest },
  ): Promise<PendingAction> {
    const conversation = await this.requireConversation(input.employeeId);
    const record = await this.deps.edit.execute({
      conversation,
      actionId: input.actionId,
      changes: input.changes,
    });
    await this.deps.notifier.conversationUpdated(conversation);
    return toPendingAction(record);
  }

  async confirm(
    input: EmployeeActionTarget & { via: ConfirmationChannel },
  ): Promise<ChatTurnOutcome> {
    const conversation = await this.requireConversation(input.employeeId);
    const { message } = await this.deps.confirm
      .execute({ conversation, actionId: input.actionId, via: input.via })
      .catch((error: unknown) => {
        throw asConfirmationError(error);
      });
    return this.publish(conversation, message);
  }

  async cancel(input: EmployeeActionTarget): Promise<PendingAction> {
    const conversation = await this.requireConversation(input.employeeId);
    const record = await this.deps.pendingActions.cancel({
      conversation,
      actionId: input.actionId,
    });
    const message = buildCancellationSystemMessage({
      conversationId: conversation.id,
      kind: record.kind,
      createdAt: this.deps.clock.now().toISOString(),
    });
    await this.deps.messages.save(message);
    await this.publish(conversation, message);
    return toPendingAction(record);
  }

  private async publish(
    conversation: Conversation,
    message: ChatMessage,
  ): Promise<ChatTurnOutcome> {
    const updated = conversation.withChanges({ lastMessageAt: message.createdAt });
    await this.deps.conversations.save(updated);
    this.deps.notifier.messageCreated({ conversation: updated, message });
    await this.deps.notifier.conversationUpdated(updated);
    return { message, conversation: await this.deps.views.build(updated) };
  }

  private async requireConversation(employeeId: string): Promise<Conversation> {
    const conversation = await this.deps.conversations.findActiveByEmployee(employeeId);
    if (conversation === null) {
      throw new ChatRuleError('not_found', ACTION_NOT_FOUND_MESSAGE);
    }
    return conversation;
  }
}
