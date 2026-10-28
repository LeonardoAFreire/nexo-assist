import type { AgentTurnEvent, ChatMessage, ChatStreamEvent, HandoffInfo } from '@nexo/contracts';
import { collectTicketNumbers, extractTicketNumbers } from '../handoff/collect-ticket-numbers.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import type { HandoffRequest, TurnAccumulator } from './turn-accumulator.js';
import { completeTurn } from './turn-completion.js';
import type { TurnContext } from './turn-context.js';

export type CompletedEvent = Extract<AgentTurnEvent, { type: 'completed' }>;

function withHandoff(message: ChatMessage, handoff: HandoffInfo | null): ChatMessage {
  const turn = message.turn;
  if (turn === null) {
    return message;
  }
  return { ...message, turn: { ...turn, decision: { ...turn.decision, handoff } } };
}

export class AgentTurnFinisher {
  constructor(private readonly deps: EmployeeTurnDeps) {}

  async finish(
    context: TurnContext,
    event: CompletedEvent,
    state: TurnAccumulator,
  ): Promise<ChatStreamEvent> {
    const message = this.buildMessage(context, event, state);
    await this.deps.messages.save(message);
    if (state.handoff === null) {
      return completeTurn(this.deps, { ...context, message });
    }
    return this.finishWithHandoff(context, message, state.handoff);
  }

  private async finishWithHandoff(
    context: TurnContext,
    message: ChatMessage,
    request: HandoffRequest,
  ): Promise<ChatStreamEvent> {
    const ticketNumbers = new Set([
      ...extractTicketNumbers(request.summary),
      ...collectTicketNumbers([message]),
    ]);
    const handedOff = await this.deps.handOff.execute({
      conversation: context.conversation,
      reason: request.reason,
      summary: request.summary,
      confidence: request.confidence,
      ticketNumbers: [...ticketNumbers],
    });
    const updated = withHandoff(message, handedOff.props.handoff);
    await this.deps.messages.save(updated);
    return completeTurn(this.deps, { ...context, conversation: handedOff, message: updated });
  }

  private buildMessage(
    context: TurnContext,
    event: CompletedEvent,
    state: TurnAccumulator,
  ): ChatMessage {
    return {
      id: context.replyId,
      conversationId: context.conversation.id,
      author: 'agent',
      authorName: null,
      authorLevel: null,
      text: event.text,
      parts: state.parts,
      turn: { steps: event.steps, decision: event.decision },
      status: 'complete',
      createdAt: this.deps.clock.now().toISOString(),
    };
  }
}
