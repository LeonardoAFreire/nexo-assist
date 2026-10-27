import type { EvalCriterion } from '../types.js';
import { defineCriterion } from './criterion.js';

export function anyOf(id: string, description: string, options: EvalCriterion[]): EvalCriterion {
  return defineCriterion(id, description, (observation) =>
    options.some((option) => option.check(observation)),
  );
}
