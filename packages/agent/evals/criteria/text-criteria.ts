import type { EvalCriterion } from '../types.js';
import { defineCriterion } from './criterion.js';

export function mentions(pattern: RegExp, description: string): EvalCriterion {
  return defineCriterion(`mentions-${pattern.source}`, `resposta ${description}`, (observation) =>
    pattern.test(observation.text),
  );
}

export function omits(pattern: RegExp, description: string): EvalCriterion {
  return defineCriterion(
    `omits-${pattern.source}`,
    `resposta ${description}`,
    (observation) => !pattern.test(observation.text),
  );
}
