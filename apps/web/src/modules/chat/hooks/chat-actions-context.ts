import type { SendMessageRequest } from '@nexo/contracts';
import { createContext, useContext } from 'react';

export type ChatActions = {
  busy: boolean;
  latestMessageId: string | null;
  reply: (request: SendMessageRequest) => void;
};

const idleActions: ChatActions = { busy: true, latestMessageId: null, reply: () => undefined };

export const ChatActionsContext = createContext<ChatActions>(idleActions);

export function useChatActions(): ChatActions {
  return useContext(ChatActionsContext);
}
