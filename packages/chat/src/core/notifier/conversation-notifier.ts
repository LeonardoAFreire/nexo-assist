import type { ChatMessage } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationEventsHub } from '../events/conversation-events-hub.js';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';

export type NotifyMessageInput = {
  conversation: Conversation;
  message: ChatMessage;
};

export class ConversationNotifier {
  constructor(
    private readonly hub: ConversationEventsHub,
    private readonly views: ConversationViewBuilder,
  ) {}

  async conversationUpdated(conversation: Conversation): Promise<void> {
    const view = await this.views.build(conversation);
    this.hub.publish({
      employeeId: conversation.employeeId,
      conversationId: conversation.id,
      event: { event: 'conversation.updated', data: { conversation: view } },
    });
  }

  messageCreated(input: NotifyMessageInput): void {
    this.hub.publish({
      employeeId: input.conversation.employeeId,
      conversationId: input.conversation.id,
      event: { event: 'message.created', data: { message: input.message } },
    });
  }
}
