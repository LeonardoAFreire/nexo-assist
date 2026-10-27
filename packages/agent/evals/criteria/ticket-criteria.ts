import type { EvalCriterion } from '../types.js';
import { defineCriterion } from './criterion.js';

const MINIMUM_OPTIONS = 2;

export function showedCard(number: string): EvalCriterion {
  return defineCriterion(`card-${number}`, `exibiu o card de ${number}`, (observation) =>
    observation.parts.some((part) => part.type === 'ticket_card' && part.ticket.number === number),
  );
}

export function showedSelection(count: number): EvalCriterion {
  const description = `exibiu a seleção com ${count} chamados`;
  return defineCriterion(`selection-${count}`, description, (observation) =>
    observation.parts.some(
      (part) => part.type === 'ticket_selection' && part.tickets.length === count,
    ),
  );
}

export function askedQuickOptions(topic: RegExp): EvalCriterion {
  const description = `perguntou com opções sobre ${topic.source}`;
  return defineCriterion(`asked-${topic.source}`, description, (observation) =>
    observation.parts.some(
      (part) =>
        part.type === 'quick_options' &&
        part.options.length >= MINIMUM_OPTIONS &&
        topic.test(part.question),
    ),
  );
}

export function didNotAsk(topic: RegExp): EvalCriterion {
  const description = `não perguntou sobre ${topic.source}`;
  return defineCriterion(`not-asked-${topic.source}`, description, (observation) =>
    observation.parts.every((part) => part.type !== 'quick_options' || !topic.test(part.question)),
  );
}
