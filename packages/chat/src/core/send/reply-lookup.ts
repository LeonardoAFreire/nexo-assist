import type { ChatMessage, QuickOption } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { MessageRepository } from '../messages/message-repository.js';

const INVALID_REPLY_MESSAGE = 'A opção ou o chamado escolhido não está mais disponível.';

export async function requireReplyMessage(
  messages: Pick<MessageRepository, 'findById'>,
  conversation: Conversation,
  messageId: string,
): Promise<ChatMessage> {
  const message = await messages.findById(messageId);
  if (message === null || message.conversationId !== conversation.id) {
    throw new ChatRuleError('validation_error', INVALID_REPLY_MESSAGE);
  }
  return message;
}

export function requireOpenOption(message: ChatMessage, optionId: string): QuickOption {
  const open = message.parts.flatMap((part) =>
    part.type === 'quick_options' && !part.answered ? part.options : [],
  );
  const option = open.find((candidate) => candidate.id === optionId);
  if (option === undefined) {
    throw new ChatRuleError('validation_error', INVALID_REPLY_MESSAGE);
  }
  return option;
}

export function assertTicketOffered(message: ChatMessage, number: string): void {
  const isOffered = message.parts.some(
    (part) =>
      part.type === 'ticket_selection' &&
      part.selectedNumber === null &&
      part.tickets.some((ticket) => ticket.number === number),
  );
  if (!isOffered) {
    throw new ChatRuleError('validation_error', INVALID_REPLY_MESSAGE);
  }
}
