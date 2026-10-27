import type { AgentStep } from '@nexo/contracts';

export const STEP_FAILED_LABEL = 'falhou';
export const STEP_OK_LABEL = 'concluído';
const PERCENT_FACTOR = 100;

export function formatAttempts(attempts: number): string {
  return attempts > 1 ? `${attempts} tentativas` : '';
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * PERCENT_FACTOR)}%`;
}

export function stepStatusLabel(step: AgentStep): string {
  return step.status === 'failed' ? STEP_FAILED_LABEL : STEP_OK_LABEL;
}
