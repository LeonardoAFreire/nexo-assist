import type { AgentDecision, AgentStep, AgentTurnEvent, ChatStreamEvent } from '@nexo/contracts';

export function makeStep(overrides: Partial<AgentStep> = {}): AgentStep {
  return {
    id: 's1',
    kind: 'searched_tickets',
    label: 'consultou seus chamados',
    result: '1 chamado encontrado',
    status: 'ok',
    attempts: 1,
    durationMs: 10,
    ...overrides,
  };
}

export function makeDecision(overrides: Partial<AgentDecision> = {}): AgentDecision {
  return {
    understood: {
      intent: 'ticket_status',
      intentLabel: 'consultar chamado',
      summary: 'Ana quer o andamento do INC-20311',
      entities: [],
    },
    action: { kind: 'replied', label: 'respondeu' },
    confidence: { value: 0.86, label: 'alta' },
    reason: 'pedido claro',
    rules: [],
    handoff: null,
    ...overrides,
  };
}

export function completedEvent(
  text: string,
  decision: AgentDecision = makeDecision(),
): AgentTurnEvent {
  return { type: 'completed', text, steps: [makeStep()], decision, runId: 'run-1' };
}

export async function collectEvents(
  stream: AsyncIterable<ChatStreamEvent>,
): Promise<ChatStreamEvent[]> {
  const events: ChatStreamEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

export function eventNames(events: readonly ChatStreamEvent[]): string[] {
  return events.map((event) => event.event);
}
