import type { AgentTurnEvent, ChatStreamEvent } from '@nexo/contracts';
import type { PendingActionRecord } from '../pending-actions/pending-action-record.js';
import { toPendingAction } from '../pending-actions/to-pending-action.js';
import { buildAgentTurnInput } from './agent-turn-input.js';
import { AgentTurnFinisher } from './agent-turn-finisher.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import { TurnAccumulator } from './turn-accumulator.js';
import type { TurnContext } from './turn-context.js';
import { AgentTurnFailedError } from './turn-failure.js';

type ProgressEvent = Exclude<AgentTurnEvent, { type: 'completed' | 'failed' }>;

export class AgentTurnRunner {
  private readonly finisher: AgentTurnFinisher;

  constructor(private readonly deps: EmployeeTurnDeps) {
    this.finisher = new AgentTurnFinisher(deps);
  }

  async *run(
    context: TurnContext,
    pending: PendingActionRecord | null,
  ): AsyncGenerator<ChatStreamEvent> {
    const input = await buildAgentTurnInput(this.deps.messages, { context, pending });
    const state = new TurnAccumulator();
    for await (const event of this.deps.agent.respond(input)) {
      if (context.signal.aborted) {
        break;
      }
      if (event.type === 'completed') {
        yield await this.finisher.finish(context, event, state);
        return;
      }
      if (event.type === 'failed') {
        throw new AgentTurnFailedError(event.code, event.retryable);
      }
      const forwarded = await this.forward(event, context, state);
      if (forwarded !== null) {
        yield forwarded;
      }
    }
    throw new AgentTurnFailedError('agent_unavailable', true);
  }

  private async forward(
    event: ProgressEvent,
    context: TurnContext,
    state: TurnAccumulator,
  ): Promise<ChatStreamEvent | null> {
    switch (event.type) {
      case 'step':
        return { event: 'turn.step', data: { step: event.step } };
      case 'text-delta':
        return { event: 'turn.text-delta', data: { delta: event.delta } };
      case 'part':
        state.addPart(event.part);
        return { event: 'turn.part', data: { part: event.part } };
      case 'proposal':
        return this.proposalPart(event, context, state);
      case 'handoff-requested':
        state.requestHandoff(event);
        return null;
    }
  }

  private async proposalPart(
    event: Extract<ProgressEvent, { type: 'proposal' }>,
    context: TurnContext,
    state: TurnAccumulator,
  ): Promise<ChatStreamEvent> {
    const { kind, draft, targetNumber, complement } = event;
    const record = await this.deps.pendingActions.propose({
      conversationId: context.conversation.id,
      proposal: { kind, draft, targetNumber, complement },
    });
    const part = { type: 'pending_action', action: toPendingAction(record) } as const;
    state.addPart(part);
    return { event: 'turn.part', data: { part } };
  }
}
