import type { ConversationHandedOffPayload } from './chat/conversation-handed-off-payload.js';

export type DomainEvent<TName extends string, TPayload> = {
  name: TName;
  occurredAt: string;
  payload: TPayload;
};

export type EventHandler<TEvent extends DomainEvent<string, unknown>> = (
  event: TEvent,
) => void | Promise<void>;

export const CHAT_CONVERSATION_HANDED_OFF = 'chat.conversation.handed-off';

export type ChatConversationHandedOff = DomainEvent<
  typeof CHAT_CONVERSATION_HANDED_OFF,
  ConversationHandedOffPayload
>;
