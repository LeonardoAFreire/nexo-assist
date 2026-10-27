import type { ChatMessage, MessagePart } from '@nexo/contracts';
import type { PendingActionRepository } from '../pending-actions/pending-action-repository.js';
import { toPendingAction } from '../pending-actions/to-pending-action.js';

export const EMPLOYEE_TIMELINE_LIMIT = 100;
export const CONSOLE_TIMELINE_LIMIT = 500;

export class TimelineBuilder {
  constructor(private readonly actions: Pick<PendingActionRepository, 'findById'>) {}

  async refreshPendingActions(messages: readonly ChatMessage[]): Promise<ChatMessage[]> {
    return Promise.all(messages.map((message) => this.refreshMessage(message)));
  }

  private async refreshMessage(message: ChatMessage): Promise<ChatMessage> {
    const parts = await Promise.all(message.parts.map((part) => this.refreshPart(part)));
    return { ...message, parts };
  }

  private async refreshPart(part: MessagePart): Promise<MessagePart> {
    if (part.type !== 'pending_action') {
      return part;
    }
    const latest = await this.actions.findById(part.action.id);
    return latest === null ? part : { type: 'pending_action', action: toPendingAction(latest) };
  }
}
