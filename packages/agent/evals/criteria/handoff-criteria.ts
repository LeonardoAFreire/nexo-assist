import type { HandoffReason } from '@nexo/contracts';
import type { EvalCriterion } from '../types.js';
import { defineCriterion } from './criterion.js';

export function handedOff(reason: HandoffReason): EvalCriterion {
  return defineCriterion(
    `handed-off-${reason}`,
    `transferiu com resumo (${reason})`,
    (observation) => {
      const { handoff } = observation;
      return handoff !== null && handoff.reason === reason && handoff.summary.trim() !== '';
    },
  );
}

export function notHandedOff(): EvalCriterion {
  return defineCriterion(
    'not-handed-off',
    'não transferiu para um analista',
    (observation) => observation.handoff === null,
  );
}

export function offeredAnalyst(): EvalCriterion {
  return defineCriterion('offered-analyst', 'ofereceu falar com um analista', (observation) =>
    observation.parts.some(
      (part) =>
        part.type === 'quick_options' &&
        part.options.some((option) => /analista/i.test(option.label)),
    ),
  );
}
