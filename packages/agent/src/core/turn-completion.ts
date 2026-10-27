import type { AgentDecision, Understanding } from '@nexo/contracts';
import type { Degradation } from './degradation.js';
import type { AgentRun, AgentRunOutcome } from './agent-run.js';
import { DecisionBuilder } from './decision-builder.js';
import type { TurnSession } from './turn-session.js';

export type CompletionInput = {
  understanding: Understanding;
  degradation: Degradation | null;
};

export function buildDecision(turn: TurnSession, input: CompletionInput): AgentDecision {
  const { degradation } = input;
  return new DecisionBuilder().build({
    understanding: input.understanding,
    steps: turn.recorder.steps,
    rules: turn.recorder.rules,
    handoff: null,
    legacyUnavailable: degradation?.legacyUnavailable ?? false,
    degradedReason: degradation?.reason,
  });
}

function deriveOutcome(turn: TurnSession, degradation: Degradation | null): AgentRunOutcome {
  if (degradation) {
    return 'degraded';
  }
  return turn.observer.handoff ? 'handed_off' : 'answered';
}

export function buildRun(
  turn: TurnSession,
  input: CompletionInput,
  decision: AgentDecision,
): AgentRun {
  const { understanding, degradation } = input;
  return {
    id: turn.runId,
    conversationId: turn.context.conversationId,
    intent: understanding.intent,
    confidence: understanding.confidence,
    action: decision.action.kind,
    handoffReason: turn.observer.handoff?.reason ?? null,
    steps: turn.recorder.steps,
    ...turn.metrics.snapshot(),
    firstTokenMs: turn.observer.firstTokenMs,
    durationMs: turn.elapsedMs(),
    outcome: deriveOutcome(turn, degradation),
    createdAt: turn.context.clock.now().toISOString(),
  };
}
