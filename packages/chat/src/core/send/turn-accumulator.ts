import type { AgentTurnEvent, MessagePart } from '@nexo/contracts';

export type HandoffRequest = Extract<AgentTurnEvent, { type: 'handoff-requested' }>;

export class TurnAccumulator {
  readonly parts: MessagePart[] = [];
  handoff: HandoffRequest | null = null;

  addPart(part: MessagePart): void {
    this.parts.push(part);
  }

  requestHandoff(request: HandoffRequest): void {
    this.handoff = request;
  }
}
