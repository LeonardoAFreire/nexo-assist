import type { ChatMessage, ChatStreamEvent, EmployeeConversationView } from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { chatKeys } from './chat-keys.js';

function withoutFailedTail(timeline: ChatMessage[]): ChatMessage[] {
  const last = timeline.at(-1);
  const hasFailedTail = last?.author === 'agent' && last.status === 'failed';
  return hasFailedTail ? timeline.slice(0, -1) : timeline;
}

function updateView(
  queryClient: QueryClient,
  update: (view: EmployeeConversationView) => EmployeeConversationView,
): void {
  queryClient.setQueryData<EmployeeConversationView>(chatKeys.conversation, (view) =>
    view ? update(view) : view,
  );
}

export function applyEventToCache(queryClient: QueryClient, event: ChatStreamEvent): void {
  if (event.event === 'message.accepted') {
    const { message, usage } = event.data;
    updateView(queryClient, (view) => ({ ...view, usage, timeline: [...view.timeline, message] }));
  }
  if (event.event === 'turn.completed') {
    const { message, conversation, usage } = event.data;
    updateView(queryClient, (view) => ({
      ...view,
      conversation,
      usage,
      timeline: [...withoutFailedTail(view.timeline), message],
    }));
  }
  if (event.event === 'turn.skipped') {
    void queryClient.invalidateQueries({ queryKey: chatKeys.conversation });
  }
}
