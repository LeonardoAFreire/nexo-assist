import type { ChatMessage, ChatStreamEvent } from '@nexo/contracts';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import { EmployeeTurnRunner } from './employee-turn-runner.js';
import type { EmployeeSession, TurnContext } from './turn-context.js';
import { TurnLock } from './turn-lock.js';

const NO_FAILED_TURN_MESSAGE = 'Não há resposta com falha para refazer.';
const RETRY_HISTORY_LIMIT = 10;

export type RetryEmployeeTurnInput = {
  session: EmployeeSession;
  signal: AbortSignal;
};

export class RetryEmployeeTurn {
  private readonly runner: EmployeeTurnRunner;
  private readonly lock: TurnLock;

  constructor(private readonly deps: EmployeeTurnDeps) {
    this.runner = new EmployeeTurnRunner(deps);
    this.lock = new TurnLock(deps.conversations, deps.clock);
  }

  async execute(input: RetryEmployeeTurnInput): Promise<AsyncIterable<ChatStreamEvent>> {
    const active = await this.deps.conversations.findActiveByEmployee(input.session.userId);
    if (active === null || active.state !== 'agent') {
      throw new ChatRuleError('not_found', NO_FAILED_TURN_MESSAGE);
    }
    const employeeMessage = await this.failedTurnRequest(active.id);
    const conversation = await this.lock.acquire(active.id);
    const usage = await this.deps.allowance.current(input.session.sessionId);
    const context: TurnContext = {
      session: input.session,
      conversation,
      employeeMessage,
      agentText: employeeMessage.text,
      usage: { messagesUsed: usage.messagesUsed, messagesLimit: usage.messagesLimit },
      signal: input.signal,
    };
    return this.runner.runLocked(context, []);
  }

  private async failedTurnRequest(conversationId: string): Promise<ChatMessage> {
    const recent = await this.deps.messages.listRecent({
      conversationId,
      limit: RETRY_HISTORY_LIMIT,
    });
    const last = recent.at(-1);
    const request = [...recent].reverse().find((message) => message.author === 'employee');
    if (last?.author !== 'agent' || last.status !== 'failed' || request === undefined) {
      throw new ChatRuleError('not_found', NO_FAILED_TURN_MESSAGE);
    }
    return request;
  }
}
