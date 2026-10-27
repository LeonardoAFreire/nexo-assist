import type { Conversation, ConversationStreamEvent } from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { appendUnique, updateView } from './conversation-cache.js';

function activeConversation(conversation: Conversation): Conversation | null {
  return conversation.state === 'closed' ? null : conversation;
}

export function applyConversationEvent(
  queryClient: QueryClient,
  event: ConversationStreamEvent,
): void {
  if (event.event === 'message.created') {
    const { message } = event.data;
    updateView(queryClient, (view) => ({
      ...view,
      timeline: appendUnique(view.timeline, message),
    }));
  }
  if (event.event === 'conversation.updated') {
    const conversation = activeConversation(event.data.conversation);
    updateView(queryClient, (view) => ({ ...view, conversation }));
  }
}
