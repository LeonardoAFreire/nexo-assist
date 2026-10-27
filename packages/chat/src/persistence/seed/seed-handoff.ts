import type { HandoffInfo } from '@nexo/contracts';
import { afterMinutes } from './seed-factories.js';

const CONTACT_WINDOW_MINUTES = 60;

export function buildHandoff(
  input: Partial<HandoffInfo> & Pick<HandoffInfo, 'handedOffAt'>,
): HandoffInfo {
  const dueAt = afterMinutes(new Date(input.handedOffAt), CONTACT_WINDOW_MINUTES);
  return {
    reason: 'requested',
    level: 'N1',
    summary: 'Resumo gerado na transferência.',
    ticketNumbers: [],
    confidence: null,
    contactDueAt: dueAt.toISOString(),
    ...input,
  };
}
