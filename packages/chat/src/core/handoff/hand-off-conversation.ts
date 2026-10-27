import type {
  ChatConversationHandedOff,
  HandoffInfo,
  HandoffReason,
  SupportLevel,
} from '@nexo/contracts';
import { CHAT_CONVERSATION_HANDED_OFF } from '@nexo/contracts';
import type { Clock } from '../clock/clock.js';
import { formatClockTime } from '../clock/format-clock-time.js';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { buildSystemMessage } from '../messages/system-message.js';
import type { ConversationNotifier } from '../notifier/conversation-notifier.js';
import type { HandoffAssessment, HandoffPolicy } from './handoff-policy.js';

const FALLBACK_CONTACT_WINDOW_MS = 2 * 60 * 60 * 1000;

export interface HandoffEventPublisher {
  publish(event: ChatConversationHandedOff): Promise<void>;
}

export type HandOffConversationDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  policy: Pick<HandoffPolicy, 'assess' | 'levelFor'>;
  events: HandoffEventPublisher;
  notifier: ConversationNotifier;
  clock: Clock;
};

export type HandOffInput = {
  conversation: Conversation;
  reason: HandoffReason;
  summary: string;
  confidence: number | null;
  ticketNumbers: string[];
};

export class HandOffConversation {
  constructor(private readonly deps: HandOffConversationDeps) {}

  async execute(input: HandOffInput): Promise<Conversation> {
    const handedOffAt = this.deps.clock.now().toISOString();
    const assessment = await this.assess(input.reason, handedOffAt);
    const handoff: HandoffInfo = {
      reason: input.reason,
      summary: input.summary,
      confidence: input.confidence,
      ticketNumbers: input.ticketNumbers,
      level: assessment.level,
      contactDueAt: assessment.contactDueAt,
      handedOffAt,
    };
    const handedOff = input.conversation.handOff(handoff);
    await this.deps.conversations.save(handedOff);
    const message = buildSystemMessage({
      conversationId: handedOff.id,
      kind: 'handed_off',
      label: handoffLabel(assessment.level, assessment.contactDueAt),
      actorName: null,
      createdAt: handedOffAt,
    });
    await this.deps.messages.save(message);
    await this.deps.events.publish(handedOffEvent(handedOff, handoff));
    this.deps.notifier.messageCreated({ conversation: handedOff, message });
    await this.deps.notifier.conversationUpdated(handedOff);
    return handedOff;
  }

  private async assess(reason: HandoffReason, handedOffAt: string): Promise<HandoffAssessment> {
    try {
      return await this.deps.policy.assess({ reason, handedOffAt });
    } catch {
      const contactDueAt = new Date(Date.parse(handedOffAt) + FALLBACK_CONTACT_WINDOW_MS);
      return { level: this.deps.policy.levelFor(reason), contactDueAt: contactDueAt.toISOString() };
    }
  }
}

function handoffLabel(level: SupportLevel, contactDueAt: string): string {
  return `Transferida para o suporte ${level} · contato até ${formatClockTime(contactDueAt)}`;
}

function handedOffEvent(
  conversation: Conversation,
  handoff: HandoffInfo,
): ChatConversationHandedOff {
  return {
    name: CHAT_CONVERSATION_HANDED_OFF,
    occurredAt: handoff.handedOffAt,
    payload: {
      conversationId: conversation.id,
      requesterId: conversation.employeeId,
      reason: handoff.reason,
      level: handoff.level,
      ticketNumbers: handoff.ticketNumbers,
    },
  };
}
