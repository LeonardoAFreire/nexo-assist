import type { EvalCriterion, TurnObservation } from '../types.js';

export function defineCriterion(
  id: string,
  description: string,
  check: (observation: TurnObservation) => boolean,
): EvalCriterion {
  return { id, description, check };
}
