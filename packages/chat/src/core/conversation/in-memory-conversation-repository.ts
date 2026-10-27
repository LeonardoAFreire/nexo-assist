import { Conversation } from './conversation.js';
import type { ConversationProps } from './conversation-props.js';
import type {
  AcquireTurnLockInput,
  ConversationRepository,
  SaveWhenStateInput,
} from './conversation-repository.js';

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly stored = new Map<string, ConversationProps>();

  async findById(id: string): Promise<Conversation | null> {
    const props = this.stored.get(id);
    return props === undefined ? null : new Conversation(props);
  }

  async findActiveByEmployee(employeeId: string): Promise<Conversation | null> {
    const active = [...this.stored.values()].find(
      (props) => props.employeeId === employeeId && props.state !== 'closed',
    );
    return active === undefined ? null : new Conversation(active);
  }

  async listByEmployee(employeeId: string): Promise<Conversation[]> {
    return [...this.stored.values()]
      .filter((props) => props.employeeId === employeeId)
      .map((props) => new Conversation(props));
  }

  async listAll(): Promise<Conversation[]> {
    return [...this.stored.values()].map((props) => new Conversation(props));
  }

  async save(conversation: Conversation): Promise<void> {
    this.stored.set(conversation.id, conversation.props);
  }

  async saveWhenState(input: SaveWhenStateInput): Promise<boolean> {
    const current = this.stored.get(input.conversation.id);
    if (current?.state !== input.expectedState) {
      return false;
    }
    this.stored.set(input.conversation.id, input.conversation.props);
    return true;
  }

  async acquireTurnLock(input: AcquireTurnLockInput): Promise<Conversation | null> {
    const current = this.stored.get(input.conversationId);
    if (current === undefined || isLocked(current, input.now)) {
      return null;
    }
    const locked = { ...current, turnLockUntil: input.until };
    this.stored.set(input.conversationId, locked);
    return new Conversation(locked);
  }

  async releaseTurnLock(conversationId: string): Promise<void> {
    const current = this.stored.get(conversationId);
    if (current !== undefined) {
      this.stored.set(conversationId, { ...current, turnLockUntil: null });
    }
  }

  async markAnalystRead(conversationId: string, readAt: string): Promise<Conversation | null> {
    const current = this.stored.get(conversationId);
    if (current === undefined) {
      return null;
    }
    const read = { ...current, analystReadAt: readAt };
    this.stored.set(conversationId, read);
    return new Conversation(read);
  }
}

function isLocked(props: ConversationProps, now: string): boolean {
  return props.turnLockUntil !== null && props.turnLockUntil > now;
}
