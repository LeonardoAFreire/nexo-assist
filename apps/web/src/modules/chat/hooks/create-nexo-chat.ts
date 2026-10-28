import { Chat } from '@ai-sdk/react';
import { NexoChatTransport } from '../api/nexo-chat-transport.js';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { type ChatEffects, handleData, handleError } from './chat-stream-effects.js';

const CHAT_ID = 'employee-chat';

export type NexoChatDeps = Omit<ChatEffects, 'chat'>;

export function createNexoChat(deps: NexoChatDeps, initial: NexoUIMessage[]): Chat<NexoUIMessage> {
  const effects: ChatEffects = { ...deps, chat: () => chat };
  const chat: Chat<NexoUIMessage> = new Chat<NexoUIMessage>({
    id: CHAT_ID,
    messages: initial,
    transport: new NexoChatTransport(),
    generateId: () => crypto.randomUUID(),
    onData: (part) => handleData(part, effects),
    onError: (error) => handleError(error, effects),
  });
  return chat;
}
