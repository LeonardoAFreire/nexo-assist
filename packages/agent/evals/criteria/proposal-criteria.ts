import type { PendingActionKind, TicketDraft } from '@nexo/contracts';
import type { EvalCriterion, ProposalObservation } from '../types.js';
import { defineCriterion } from './criterion.js';

export type DraftExpectation = Partial<
  Pick<TicketDraft, 'type' | 'category' | 'priority' | 'affected'>
>;

function isProposalOf(
  proposal: ProposalObservation,
  kind: PendingActionKind,
  targetNumber: string | undefined,
): boolean {
  const sameTarget = targetNumber === undefined || proposal.targetNumber === targetNumber;
  return proposal.kind === kind && sameTarget;
}

export function proposed(kind: PendingActionKind, targetNumber?: string): EvalCriterion {
  const target = targetNumber === undefined ? '' : ` para ${targetNumber}`;
  return defineCriterion(`proposed-${kind}`, `propôs ${kind}${target}`, (observation) =>
    observation.proposals.some((proposal) => isProposalOf(proposal, kind, targetNumber)),
  );
}

export function noProposal(): EvalCriterion {
  return defineCriterion(
    'no-proposal',
    'não propôs nenhuma escrita',
    (observation) => observation.proposals.length === 0,
  );
}

export function neverProposed(kind: PendingActionKind): EvalCriterion {
  return defineCriterion(`never-${kind}`, `não propôs ${kind}`, (observation) =>
    observation.proposals.every((proposal) => proposal.kind !== kind),
  );
}

function matchesExpectation(draft: TicketDraft, expected: DraftExpectation): boolean {
  return Object.entries(expected).every(
    ([field, value]) => draft[field as keyof DraftExpectation] === value,
  );
}

export function draftMatches(expected: DraftExpectation): EvalCriterion {
  const fields = Object.entries(expected)
    .map(([field, value]) => `${field}=${value}`)
    .join(', ');
  return defineCriterion('draft-matches', `rascunho igual ao gabarito (${fields})`, (observation) =>
    observation.proposals.some(
      (proposal) => proposal.draft !== null && matchesExpectation(proposal.draft, expected),
    ),
  );
}

function hasRequiredFields(draft: TicketDraft | null): boolean {
  if (draft === null) {
    return false;
  }
  const filled = [draft.title, draft.description, draft.type, draft.category, draft.priority];
  return filled.every((value) => value.trim() !== '') && draft.affected !== 'unknown';
}

export function draftComplete(): EvalCriterion {
  return defineCriterion(
    'draft-complete',
    'rascunho com os seis campos obrigatórios',
    (observation) => observation.proposals.some((proposal) => hasRequiredFields(proposal.draft)),
  );
}
