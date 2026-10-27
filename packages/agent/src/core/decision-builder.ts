import type {
  AgentDecision,
  AgentStep,
  AgentStepKind,
  DecisionAction,
  DecisionConfidence,
  HandoffInfo,
  Understanding,
} from '@nexo/contracts';
import { describeUnderstanding } from './describe-understanding.js';

export const HIGH_CONFIDENCE_THRESHOLD = 0.8;
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

const DEGRADED_ACTION: DecisionAction = {
  kind: 'degraded',
  label: 'avisou da indisponibilidade',
};
const DEGRADED_REASON =
  'o sistema de chamados não respondeu após as tentativas, então o agent avisou e ofereceu alternativas';
const INCOMPLETE_ACTION: DecisionAction = {
  kind: 'degraded',
  label: 'avisou que não conseguiu concluir',
};
const HANDOFF_ACTION: DecisionAction = { kind: 'handed_off', label: 'transferiu para um analista' };
const REPLIED_ACTION: DecisionAction = { kind: 'replied', label: 'respondeu ao funcionário' };
const ACTION_STEP_KINDS: AgentStepKind[] = [
  'handed_off',
  'built_draft',
  'proposed_update',
  'proposed_reopen',
  'asked_question',
];

export type DecisionInput = {
  understanding: Understanding;
  steps: AgentStep[];
  rules: string[];
  handoff: HandoffInfo | null;
  legacyUnavailable: boolean;
  degradedReason?: string;
};

export function labelConfidence(value: number): DecisionConfidence {
  if (value >= HIGH_CONFIDENCE_THRESHOLD) {
    return { value, label: 'alta' };
  }
  return { value, label: value >= MEDIUM_CONFIDENCE_THRESHOLD ? 'média' : 'baixa' };
}

function deriveAction(input: DecisionInput): DecisionAction {
  if (input.legacyUnavailable) {
    return DEGRADED_ACTION;
  }
  if (input.degradedReason !== undefined) {
    return INCOMPLETE_ACTION;
  }
  if (input.handoff) {
    return HANDOFF_ACTION;
  }
  const succeeded = input.steps.filter((step) => step.status === 'ok');
  const decisive = succeeded.filter((step) => ACTION_STEP_KINDS.includes(step.kind)).at(-1);
  const step = decisive ?? succeeded.at(-1);
  return step ? { kind: step.kind, label: step.label } : REPLIED_ACTION;
}

function deriveReason(input: DecisionInput): string {
  if (input.legacyUnavailable) {
    return DEGRADED_REASON;
  }
  return input.degradedReason ?? input.understanding.reason;
}

function uniqueRules(rules: string[]): string[] {
  return [...new Set(rules)];
}

export class DecisionBuilder {
  build(input: DecisionInput): AgentDecision {
    const { understanding } = input;
    return {
      understood: describeUnderstanding(understanding),
      action: deriveAction(input),
      confidence: labelConfidence(understanding.confidence),
      reason: deriveReason(input),
      rules: uniqueRules(input.rules),
      handoff: input.handoff,
    };
  }
}
