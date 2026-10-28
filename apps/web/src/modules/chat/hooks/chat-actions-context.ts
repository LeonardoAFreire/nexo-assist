import { createContext, useContext } from 'react';
import type { ReplyRequest, TimelineUpdater } from '../types/nexo-ui-message.js';

export type ChatActions = {
  busy: boolean;
  latestMessageId: string | null;
  reply: (request: ReplyRequest) => void;
  updateTimeline: TimelineUpdater;
};

const idleActions: ChatActions = {
  busy: true,
  latestMessageId: null,
  reply: () => undefined,
  updateTimeline: () => undefined,
};

export const ChatActionsContext = createContext<ChatActions>(idleActions);

export function useChatActions(): ChatActions {
  return useContext(ChatActionsContext);
}
