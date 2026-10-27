import type { ConversationState, HandoffInfo } from '@nexo/contracts';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { ConversationProps } from './conversation-props.js';

const ALLOWED_TRANSITIONS: Record<ConversationState, readonly ConversationState[]> = {
  agent: ['waiting_analyst', 'closed'],
  waiting_analyst: ['with_analyst'],
  with_analyst: ['agent', 'closed'],
  closed: [],
};

export type OpenConversationInput = {
  id: string;
  employeeId: string;
  now: string;
};

export class Conversation {
  constructor(readonly props: ConversationProps) {}

  static open(input: OpenConversationInput): Conversation {
    return new Conversation({
      id: input.id,
      employeeId: input.employeeId,
      state: 'agent',
      resolution: null,
      assignedAnalystId: null,
      handoff: null,
      lastMessageAt: input.now,
      analystReadAt: null,
      turnLockUntil: null,
      closedAt: null,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get employeeId(): string {
    return this.props.employeeId;
  }

  get state(): ConversationState {
    return this.props.state;
  }

  handOff(handoff: HandoffInfo): Conversation {
    return this.moveTo('waiting_analyst', { handoff, lastMessageAt: handoff.handedOffAt });
  }

  claim(analystId: string): Conversation {
    return this.moveTo('with_analyst', { assignedAnalystId: analystId });
  }

  release(): Conversation {
    return this.moveTo('agent', { assignedAnalystId: null });
  }

  closeByAnalyst(closedAt: string): Conversation {
    return this.moveTo('closed', { resolution: 'analyst', closedAt });
  }

  closeByAgent(closedAt: string): Conversation {
    return this.moveTo('closed', { resolution: 'agent', closedAt });
  }

  withChanges(changes: Partial<ConversationProps>): Conversation {
    return new Conversation({ ...this.props, ...changes });
  }

  private moveTo(next: ConversationState, changes: Partial<ConversationProps>): Conversation {
    if (!ALLOWED_TRANSITIONS[this.props.state].includes(next)) {
      throw new ChatRuleError(
        'invalid_conversation_state',
        `Transição de ${this.props.state} para ${next} não é permitida.`,
      );
    }
    return new Conversation({ ...this.props, ...changes, state: next });
  }
}
