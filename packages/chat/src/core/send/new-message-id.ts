import { randomUUID } from 'node:crypto';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { MessageRepository } from '../messages/message-repository.js';

const DUPLICATE_MESSAGE_TEXT = 'Esta mensagem já foi enviada.';

export async function resolveNewMessageId(
  messages: Pick<MessageRepository, 'findById'>,
  clientMessageId: string | null,
): Promise<string> {
  if (clientMessageId === null) {
    return randomUUID();
  }
  const existing = await messages.findById(clientMessageId);
  if (existing !== null) {
    throw new ChatRuleError('invalid_conversation_state', DUPLICATE_MESSAGE_TEXT);
  }
  return clientMessageId;
}
