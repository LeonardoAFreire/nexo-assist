import type { ChatStreamEvent } from '@nexo/contracts';
import { CancellationMatcher } from '../matchers/cancellation-matcher.js';
import { ConfirmationMatcher } from '../matchers/confirmation-matcher.js';
import { AgentTurnRunner } from './agent-turn-runner.js';
import { ConfirmationTurnRunner } from './confirmation-turn-runner.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import { failTurn } from './turn-completion.js';
import type { TurnContext } from './turn-context.js';
import { describeFailure } from './turn-failure.js';
import { TurnLock } from './turn-lock.js';

export class EmployeeTurnRunner {
  private readonly confirmationMatcher = new ConfirmationMatcher();
  private readonly cancellationMatcher = new CancellationMatcher();
  private readonly confirmations: ConfirmationTurnRunner;
  private readonly agentTurns: AgentTurnRunner;
  private readonly lock: TurnLock;

  constructor(private readonly deps: EmployeeTurnDeps) {
    this.confirmations = new ConfirmationTurnRunner(deps);
    this.agentTurns = new AgentTurnRunner(deps);
    this.lock = new TurnLock(deps.conversations, deps.clock);
  }

  async *runLocked(
    context: TurnContext,
    head: readonly ChatStreamEvent[],
  ): AsyncGenerator<ChatStreamEvent> {
    try {
      yield* head;
      yield* this.run(context);
    } finally {
      await this.lock.release(context.conversation.id);
    }
  }

  private async *run(context: TurnContext): AsyncGenerator<ChatStreamEvent> {
    try {
      yield* this.route(context);
    } catch (error: unknown) {
      const failure = describeFailure(error);
      yield await failTurn(this.deps, { conversation: context.conversation, failure });
    }
  }

  private async *route(context: TurnContext): AsyncGenerator<ChatStreamEvent> {
    const pending = await this.deps.actions.findPendingByConversation(context.conversation.id);
    const typed = context.employeeMessage.text;
    if (pending !== null && this.confirmationMatcher.matches(typed)) {
      yield* this.confirmations.confirm(context, pending);
    } else if (pending !== null && this.cancellationMatcher.matches(typed)) {
      yield* this.confirmations.cancel(context, pending);
    } else {
      yield* this.agentTurns.run(context, pending);
    }
  }
}
