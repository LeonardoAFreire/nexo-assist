import type { EvalGoal } from './types.js';

export type GoalTarget = {
  goal: EvalGoal;
  label: string;
  minRate: number;
};

export const GOAL_TARGETS: GoalTarget[] = [
  { goal: 'resolution', label: 'Resolução sem fila', minRate: 0.9 },
  { goal: 'ticket_quality', label: 'Chamados bem abertos', minRate: 0.9 },
  { goal: 'no_duplicates', label: 'Sem duplicidade', minRate: 1 },
  { goal: 'confirmation', label: 'Confirmação antes de escrever', minRate: 1 },
  { goal: 'handoff', label: 'Encaminhamento certo', minRate: 1 },
  { goal: 'scope', label: 'Escopo', minRate: 1 },
  { goal: 'privacy', label: 'Privacidade', minRate: 1 },
  { goal: 'transparency', label: 'Transparência', minRate: 1 },
];

export const FIRST_TOKEN_P50_TARGET_MS = 2000;
export const FIRST_TOKEN_P95_TARGET_MS = 5000;
export const CONVERSATION_COST_TARGET_USD = 0.02;
export const TYPICAL_CONVERSATION_MESSAGES = 10;
