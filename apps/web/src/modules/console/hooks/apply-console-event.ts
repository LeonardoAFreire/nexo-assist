import type {
  ChatMessage,
  ConsoleConversationDetail,
  ConsoleList,
  ConsoleStreamEvent,
} from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { consoleKeys } from './console-keys.js';

const SEARCH_KEY_INDEX = 3;

type ItemUpdate = Extract<ConsoleStreamEvent, { event: 'console.item.updated' }>['data'];

function isUnfilteredSearch(queryKey: readonly unknown[]): boolean {
  return queryKey[SEARCH_KEY_INDEX] === '';
}

function replaceItem(list: ConsoleList | undefined, update: ItemUpdate): ConsoleList | undefined {
  if (!list) {
    return list;
  }
  const items = list.items.map((item) => (item.id === update.item.id ? update.item : item));
  return { items, counters: update.counters };
}

export function appendMessage(
  detail: ConsoleConversationDetail | undefined,
  message: ChatMessage,
): ConsoleConversationDetail | undefined {
  if (!detail || detail.timeline.some((current) => current.id === message.id)) {
    return detail;
  }
  return { ...detail, timeline: [...detail.timeline, message] };
}

export function applyConsoleEvent(queryClient: QueryClient, event: ConsoleStreamEvent): void {
  if (event.event === 'console.item.updated') {
    queryClient.setQueriesData<ConsoleList>(
      { queryKey: consoleKeys.lists, predicate: (query) => isUnfilteredSearch(query.queryKey) },
      (list) => replaceItem(list, event.data),
    );
    void queryClient.invalidateQueries({ queryKey: consoleKeys.lists });
  }
  if (event.event === 'message.created') {
    const { message } = event.data;
    queryClient.setQueryData<ConsoleConversationDetail>(
      consoleKeys.conversation(message.conversationId),
      (detail) => appendMessage(detail, message),
    );
  }
  if (event.event === 'conversation.updated') {
    const { conversation } = event.data;
    queryClient.setQueryData<ConsoleConversationDetail>(
      consoleKeys.conversation(conversation.id),
      (detail) => (detail ? { ...detail, conversation } : detail),
    );
    void queryClient.invalidateQueries({ queryKey: consoleKeys.tickets(conversation.id) });
  }
}
