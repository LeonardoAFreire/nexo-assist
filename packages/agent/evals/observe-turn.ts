import type { AgentTurnEvent, MessagePart } from '@nexo/contracts';
import type { HandoffObservation, ProposalObservation, TurnObservation } from './types.js';

type CompletedEvent = Extract<AgentTurnEvent, { type: 'completed' }>;
type HandoffEvent = Extract<AgentTurnEvent, { type: 'handoff-requested' }>;
type ProposalEvent = Extract<AgentTurnEvent, { type: 'proposal' }>;

function isEvent<TType extends AgentTurnEvent['type']>(type: TType) {
  return (event: AgentTurnEvent): event is Extract<AgentTurnEvent, { type: TType }> =>
    event.type === type;
}

function toProposal(event: ProposalEvent): ProposalObservation {
  return { kind: event.kind, draft: event.draft, targetNumber: event.targetNumber };
}

function toHandoff(event: HandoffEvent | undefined): HandoffObservation | null {
  return event ? { reason: event.reason, summary: event.summary } : null;
}

function partsOf(events: AgentTurnEvent[]): MessagePart[] {
  return events.filter(isEvent('part')).map((event) => event.part);
}

function textOf(events: AgentTurnEvent[], completed: CompletedEvent | undefined): string {
  if (completed) {
    return completed.text;
  }
  return events
    .filter(isEvent('text-delta'))
    .map((event) => event.delta)
    .join('');
}

export function observeTurn(events: AgentTurnEvent[], writeCalls: number): TurnObservation {
  const completed = events.find(isEvent('completed'));
  const steps = completed?.steps ?? [];
  return {
    events,
    text: textOf(events, completed),
    steps,
    stepKinds: steps.map((step) => step.kind),
    parts: partsOf(events),
    proposals: events.filter(isEvent('proposal')).map(toProposal),
    handoff: toHandoff(events.find(isEvent('handoff-requested'))),
    failureCode: events.find(isEvent('failed'))?.code ?? null,
    decision: completed?.decision ?? null,
    writeCalls,
  };
}
