import type { Conversation, ConversationStreamEvent } from '@nexo/contracts';
import { updateView } from './conversation-cache.js';
import type { ActionCacheTargets } from './pending-action-cache.js';
import { appendUnique } from './ui-messages.js';

function activeConversation(conversation: Conversation): Conversation | null {
  return conversation.state === 'closed' ? null : conversation;
}

export function applyConversationEvent(
  targets: ActionCacheTargets,
  event: ConversationStreamEvent,
): void {
  if (event.event === 'message.created') {
    const { message } = event.data;
    targets.updateTimeline((timeline) => appendUnique(timeline, message));
  }
  if (event.event === 'conversation.updated') {
    const conversation = activeConversation(event.data.conversation);
    updateView(targets.queryClient, (view) => ({ ...view, conversation }));
  }
}
