import type { EmployeeConversationView } from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { chatKeys } from './chat-keys.js';

export function updateView(
  queryClient: QueryClient,
  update: (view: EmployeeConversationView) => EmployeeConversationView,
): void {
  queryClient.setQueryData<EmployeeConversationView>(chatKeys.conversation, (view) =>
    view ? update(view) : view,
  );
}

export function invalidateConversation(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: chatKeys.conversation });
}
