import { randomUUID } from 'node:crypto';
import type { ChatMessage, ChatStreamEvent, MessageUsage } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import type { TurnFailure } from './turn-failure.js';

export type CompleteTurnInput = {
  conversation: Conversation;
  message: ChatMessage;
  usage: MessageUsage;
};

export type FailedTurnInput = {
  conversation: Conversation;
  replyId: string;
  failure: TurnFailure;
};

export function turnStarted(replyId: string): ChatStreamEvent {
  return { event: 'turn.started', data: { replyId } };
}

export async function completeTurn(
  deps: EmployeeTurnDeps,
  input: CompleteTurnInput,
): Promise<ChatStreamEvent> {
  const conversation = input.conversation.withChanges({ lastMessageAt: input.message.createdAt });
  await deps.conversations.save(conversation);
  deps.notifier.messageCreated({ conversation, message: input.message });
  await deps.notifier.conversationUpdated(conversation);
  const view = await deps.views.build(conversation);
  return {
    event: 'turn.completed',
    data: { message: input.message, conversation: view, usage: input.usage },
  };
}

export type FailedMessageInput = {
  id: string;
  conversationId: string;
  text: string;
  createdAt: string;
};

export function buildFailedMessage(input: FailedMessageInput): ChatMessage {
  return {
    id: input.id,
    conversationId: input.conversationId,
    author: 'agent',
    authorName: null,
    authorLevel: null,
    text: input.text,
    parts: [],
    turn: null,
    status: 'failed',
    createdAt: input.createdAt,
  };
}

async function failedMessageId(deps: EmployeeTurnDeps, replyId: string): Promise<string> {
  const savedReply = await deps.messages.findById(replyId);
  return savedReply === null ? replyId : randomUUID();
}

export async function failTurn(
  deps: EmployeeTurnDeps,
  input: FailedTurnInput,
): Promise<ChatStreamEvent> {
  const { conversation, failure } = input;
  const message = buildFailedMessage({
    id: await failedMessageId(deps, input.replyId),
    conversationId: conversation.id,
    text: failure.message,
    createdAt: deps.clock.now().toISOString(),
  });
  await deps.messages.save(message);
  deps.notifier.messageCreated({ conversation, message });
  const error = { code: failure.code, message: failure.message };
  return { event: 'turn.failed', data: { error, retryable: failure.retryable } };
}
