import type { CriterionResult, EvalCriterion, TurnObservation } from './types.js';

function safeCheck(criterion: EvalCriterion, observation: TurnObservation): boolean {
  try {
    return criterion.check(observation);
  } catch {
    return false;
  }
}

export function scoreObservation(
  criteria: EvalCriterion[],
  observation: TurnObservation,
): CriterionResult[] {
  return criteria.map((criterion) => ({
    id: criterion.id,
    description: criterion.description,
    passed: safeCheck(criterion, observation),
  }));
}

export function allPassed(results: CriterionResult[]): boolean {
  return results.every((result) => result.passed);
}
