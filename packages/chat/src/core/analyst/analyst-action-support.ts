import type { EventPart } from '@nexo/contracts';
import type { Clock } from '../clock/clock.js';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { buildSystemMessage } from '../messages/system-message.js';
import type { ConversationNotifier } from '../notifier/conversation-notifier.js';

const CONVERSATION_NOT_FOUND_MESSAGE = 'Conversa não encontrada.';
const NOT_CLAIMED_MESSAGE = 'Assuma o atendimento desta conversa antes de continuar.';

export type AnalystActionDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  notifier: ConversationNotifier;
  clock: Clock;
};

export type AnnounceInput = {
  conversation: Conversation;
  kind: EventPart['kind'];
  label: string;
  actorName: string;
};

export async function requireConversation(
  conversations: ConversationRepository,
  conversationId: string,
): Promise<Conversation> {
  const conversation = await conversations.findById(conversationId);
  if (conversation === null) {
    throw new ChatRuleError('not_found', CONVERSATION_NOT_FOUND_MESSAGE);
  }
  return conversation;
}

export function assertAssignedTo(conversation: Conversation, analystId: string): void {
  const isAssigned =
    conversation.state === 'with_analyst' && conversation.props.assignedAnalystId === analystId;
  if (!isAssigned) {
    throw new ChatRuleError('conversation_not_claimed', NOT_CLAIMED_MESSAGE);
  }
}

export async function announce(deps: AnalystActionDeps, input: AnnounceInput): Promise<void> {
  const message = buildSystemMessage({
    conversationId: input.conversation.id,
    kind: input.kind,
    label: input.label,
    actorName: input.actorName,
    createdAt: deps.clock.now().toISOString(),
  });
  await deps.messages.save(message);
  deps.notifier.messageCreated({ conversation: input.conversation, message });
  await deps.notifier.conversationUpdated(input.conversation);
}
