import type { AgentApi, AgentTurnEvent, AgentTurnInput } from '@nexo/contracts';
import { failureLogFields } from './failure-log-fields.js';
import { TurnEventQueue } from './turn-event-queue.js';
import { TurnRunner, type TurnRunnerDeps } from './turn-runner.js';
import { TurnSession } from './turn-session.js';

export class AgentService implements AgentApi {
  private readonly runner: TurnRunner;

  constructor(private readonly deps: TurnRunnerDeps) {
    this.runner = new TurnRunner(deps);
  }

  async *respond(input: AgentTurnInput): AsyncGenerator<AgentTurnEvent> {
    const queue = new TurnEventQueue<AgentTurnEvent>();
    const turn = new TurnSession(input, {
      clock: this.deps.clock,
      pricing: this.deps.settings.pricing,
      forward: (event) => queue.push(event),
    });
    void this.execute(input, turn).finally(() => queue.close());
    yield* queue;
  }

  private async execute(input: AgentTurnInput, turn: TurnSession): Promise<void> {
    try {
      await this.runner.run(input, turn);
    } catch (error: unknown) {
      this.deps.logger?.warn(
        failureLogFields(input.conversationId, error),
        'turno do agent falhou',
      );
      turn.emit({ type: 'failed', code: 'agent_unavailable', retryable: true });
    }
  }
}
