import type { AgentStepKind } from '@nexo/contracts';
import type { EvalCriterion } from '../types.js';
import { defineCriterion } from './criterion.js';

export function usedStep(kind: AgentStepKind): EvalCriterion {
  return defineCriterion(`used-${kind}`, `executou o passo ${kind}`, (observation) =>
    observation.stepKinds.includes(kind),
  );
}

export function skippedStep(kind: AgentStepKind): EvalCriterion {
  return defineCriterion(
    `skipped-${kind}`,
    `não executou o passo ${kind}`,
    (observation) => !observation.stepKinds.includes(kind),
  );
}

export function completedWithoutFailure(): EvalCriterion {
  return defineCriterion('no-failure', 'concluiu o turno sem falha', (observation) => {
    const hasFailedStep = observation.steps.some((step) => step.status === 'failed');
    return observation.failureCode === null && !hasFailedStep;
  });
}
