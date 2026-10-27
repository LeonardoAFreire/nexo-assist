import type { ChatMessage, QuickOption } from '@nexo/contracts';

export function findOpenOptions(lastMessage: ChatMessage | null): QuickOption[] {
  if (lastMessage === null || lastMessage.author !== 'agent') {
    return [];
  }
  const openPart = lastMessage.parts.find(
    (part) => part.type === 'quick_options' && !part.answered,
  );
  return openPart?.type === 'quick_options' ? openPart.options : [];
}
