import { BUDGET_REASON } from './budget-understanding.js';
import type { DegradationCause } from './tool-guard.js';

const STEP_LIMIT_REASON =
  'o limite de passos do turno foi atingido, então o agent avisou e ofereceu alternativas';

export type Degradation = { legacyUnavailable: boolean; reason?: string };

export const BUDGET_DEGRADATION: Degradation = { legacyUnavailable: false, reason: BUDGET_REASON };

export function toDegradation(cause: DegradationCause | null): Degradation | null {
  if (cause === null) {
    return null;
  }
  return cause === 'legacy_unavailable'
    ? { legacyUnavailable: true }
    : { legacyUnavailable: false, reason: STEP_LIMIT_REASON };
}
