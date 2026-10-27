import type { ChatMessage, MessagePart } from '@nexo/contracts';

function withParts(message: ChatMessage, parts: MessagePart[]): ChatMessage {
  return { ...message, parts };
}

export function answerQuickOptions(message: ChatMessage): ChatMessage {
  const target = message.parts.findIndex((part) => part.type === 'quick_options' && !part.answered);
  const parts = message.parts.map((part, index): MessagePart => {
    return part.type === 'quick_options' && index === target ? { ...part, answered: true } : part;
  });
  return withParts(message, parts);
}

export function selectTicket(message: ChatMessage, number: string): ChatMessage {
  const parts = message.parts.map((part): MessagePart => {
    return part.type === 'ticket_selection' ? { ...part, selectedNumber: number } : part;
  });
  return withParts(message, parts);
}
