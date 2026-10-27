import { randomUUID } from 'node:crypto';
import { Conversation } from '../conversation/conversation.js';
import { EmployeeMessageStore } from './employee-message-store.js';
import { EmployeeTextResolver, type ResolveTextInput } from './employee-text-resolver.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import { isPausedState, type PausedState } from './paused-state.js';
import { TurnLock } from './turn-lock.js';
import type { EmployeeSession, TurnContext } from './turn-context.js';

export type SendEmployeeMessageInput = ResolveTextInput & {
  session: EmployeeSession;
  signal: AbortSignal;
};

export type AcceptedMessage = {
  context: TurnContext;
  paused: PausedState | null;
};

export class EmployeeMessageAcceptor {
  private readonly resolver: EmployeeTextResolver;
  private readonly store: EmployeeMessageStore;
  private readonly lock: TurnLock;

  constructor(private readonly deps: EmployeeTurnDeps) {
    this.resolver = new EmployeeTextResolver(deps.messages);
    this.store = new EmployeeMessageStore(deps);
    this.lock = new TurnLock(deps.conversations, deps.clock);
  }

  async accept(input: SendEmployeeMessageInput): Promise<AcceptedMessage> {
    const existing = await this.deps.conversations.findActiveByEmployee(input.session.userId);
    if (existing === null) {
      return this.acceptLocked(this.openConversation(input), input, true);
    }
    if (isPausedState(existing.state)) {
      return this.acceptPaused(existing, existing.state, input);
    }
    return this.acceptLocked(await this.lock.acquire(existing.id), input, false);
  }

  private openConversation(input: SendEmployeeMessageInput): Conversation {
    const opened = Conversation.open({
      id: randomUUID(),
      employeeId: input.session.userId,
      now: this.deps.clock.now().toISOString(),
    });
    return opened.withChanges({ turnLockUntil: this.lock.expiresAt() });
  }

  private async acceptPaused(
    conversation: Conversation,
    paused: PausedState,
    input: SendEmployeeMessageInput,
  ): Promise<AcceptedMessage> {
    const usage = await this.deps.allowance.consume(input.session);
    const resolved = { text: input.text, agentText: input.text, answered: null };
    const { session, signal } = input;
    const context = await this.store.store({ conversation, session, resolved, usage, signal });
    return { context, paused };
  }

  private async acceptLocked(
    conversation: Conversation,
    input: SendEmployeeMessageInput,
    isNew: boolean,
  ): Promise<AcceptedMessage> {
    try {
      const resolved = await this.resolver.resolve(conversation, input);
      const usage = await this.deps.allowance.consume(input.session);
      const { session, signal } = input;
      const context = await this.store.store({ conversation, session, resolved, usage, signal });
      return { context, paused: null };
    } catch (error: unknown) {
      if (!isNew) {
        await this.lock.release(conversation.id);
      }
      throw error;
    }
  }
}
