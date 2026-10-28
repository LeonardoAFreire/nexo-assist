import type { ChatMessage, ChatStreamEvent, PendingActionKind } from '@nexo/contracts';
import type { PendingActionRecord } from '../pending-actions/pending-action-record.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import { completeTurn } from './turn-completion.js';
import type { TurnContext } from './turn-context.js';
import { asConfirmationError } from './turn-failure.js';

const CANCELLATION_TEXT: Record<PendingActionKind, string> = {
  create_ticket: 'Tudo bem, não abri o chamado.',
  complement_ticket: 'Tudo bem, não atualizei o chamado.',
  reopen_ticket: 'Tudo bem, não reabri o chamado.',
};

export class ConfirmationTurnRunner {
  constructor(private readonly deps: EmployeeTurnDeps) {}

  async *confirm(
    context: TurnContext,
    pending: PendingActionRecord,
  ): AsyncGenerator<ChatStreamEvent> {
    const message = await this.executeConfirmation(context, pending);
    for (const step of message.turn?.steps ?? []) {
      yield { event: 'turn.step', data: { step } };
    }
    yield await completeTurn(this.deps, { ...context, message });
  }

  async *cancel(
    context: TurnContext,
    pending: PendingActionRecord,
  ): AsyncGenerator<ChatStreamEvent> {
    await this.deps.pendingActions.cancel({
      conversation: context.conversation,
      actionId: pending.id,
    });
    const message = this.cancellationMessage(context, pending.kind);
    await this.deps.messages.save(message);
    yield await completeTurn(this.deps, { ...context, message });
  }

  private async executeConfirmation(
    context: TurnContext,
    pending: PendingActionRecord,
  ): Promise<ChatMessage> {
    try {
      const result = await this.deps.confirm.execute({
        conversation: context.conversation,
        actionId: pending.id,
        via: 'text',
        messageId: context.replyId,
      });
      return result.message;
    } catch (error: unknown) {
      throw asConfirmationError(error);
    }
  }

  private cancellationMessage(context: TurnContext, kind: PendingActionKind): ChatMessage {
    return {
      id: context.replyId,
      conversationId: context.conversation.id,
      author: 'agent',
      authorName: null,
      authorLevel: null,
      text: CANCELLATION_TEXT[kind],
      parts: [],
      turn: null,
      status: 'complete',
      createdAt: this.deps.clock.now().toISOString(),
    };
  }
}
