import type { AgentDecision } from '@nexo/contracts';
import type { TurnObservation } from '../types.js';

export const DECISION: AgentDecision = {
  understood: {
    intent: 'question',
    intentLabel: 'Dúvida',
    summary: 'Dúvida de teste',
    entities: [],
  },
  action: { kind: 'replied', label: 'respondeu' },
  confidence: { value: 0.9, label: 'alta' },
  reason: 'motivo de teste',
  rules: [],
  handoff: null,
};

export function makeObservation(overrides: Partial<TurnObservation> = {}): TurnObservation {
  return {
    events: [],
    text: '',
    steps: [],
    stepKinds: [],
    parts: [],
    proposals: [],
    handoff: null,
    failureCode: null,
    decision: DECISION,
    writeCalls: 0,
    ...overrides,
  };
}
