import { Conversation } from './conversation.js';
import type { ConversationProps } from './conversation-props.js';
import type { ConversationRepository } from './conversation-repository.js';

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

  async save(conversation: Conversation): Promise<void> {
    this.stored.set(conversation.id, conversation.props);
  }
}
