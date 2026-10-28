import type { ChatMessage } from '@nexo/contracts';
import type { NexoUIMessage, TimelineUpdate } from '../types/nexo-ui-message.js';

export function toUIMessage(message: ChatMessage): NexoUIMessage {
  return {
    id: message.id,
    role: message.author === 'employee' ? 'user' : 'assistant',
    parts: [{ type: 'text', text: message.text }],
    metadata: { message },
  };
}

export function toUIMessages(timeline: ChatMessage[]): NexoUIMessage[] {
  return timeline.map(toUIMessage);
}

export function messageKey(message: NexoUIMessage): string {
  return message.metadata?.message?.id ?? message.id;
}

export function persistedOf(messages: NexoUIMessage[]): ChatMessage[] {
  return messages.flatMap((message: NexoUIMessage) => message.metadata?.message ?? []);
}

function replaceKnown(messages: NexoUIMessage[], next: Map<string, ChatMessage>): NexoUIMessage[] {
  return messages.flatMap((message: NexoUIMessage) => {
    const replacement = next.get(messageKey(message));
    if (replacement !== undefined) {
      return [{ ...toUIMessage(replacement), id: message.id }];
    }
    return message.metadata?.message === undefined ? [message] : [];
  });
}

export function applyTimelineUpdate(
  messages: NexoUIMessage[],
  update: TimelineUpdate,
): NexoUIMessage[] {
  const next = update(persistedOf(messages));
  const byId = new Map(next.map((message: ChatMessage) => [message.id, message]));
  const known = new Set(messages.map(messageKey));
  const added = next.filter((message: ChatMessage) => !known.has(message.id));
  return [...replaceKnown(messages, byId), ...added.map(toUIMessage)];
}

function isPendingUser(message: NexoUIMessage): boolean {
  return message.role === 'user' && message.metadata?.message === undefined;
}

export function attachAccepted(messages: NexoUIMessage[], accepted: ChatMessage): NexoUIMessage[] {
  const known = messages.find((message: NexoUIMessage) => messageKey(message) === accepted.id);
  const target = messages.findLast(isPendingUser) ?? known;
  if (target === undefined) {
    return [...messages, toUIMessage(accepted)];
  }
  const others = messages.filter(
    (message: NexoUIMessage) => message === target || messageKey(message) !== accepted.id,
  );
  return others.map((message: NexoUIMessage) =>
    message === target ? { ...toUIMessage(accepted), id: message.id } : message,
  );
}

export function withoutPendingUser(messages: NexoUIMessage[]): NexoUIMessage[] {
  const pending = messages.findLast(isPendingUser);
  return messages.filter((message: NexoUIMessage) => message !== pending);
}

export function appendUnique(timeline: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const others = timeline.filter((current: ChatMessage) => current.id !== message.id);
  return [...others, message];
}
