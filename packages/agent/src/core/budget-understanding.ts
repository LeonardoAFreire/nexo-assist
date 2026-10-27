import type { Understanding } from '@nexo/contracts';

export const BUDGET_REASON =
  'o orçamento de tokens da conversa foi atingido, então o agent avisou e ofereceu alternativas';

export const BUDGET_UNDERSTANDING: Understanding = {
  intent: 'other',
  summary: 'Conversa sem orçamento de tokens disponível',
  entities: {
    ticketNumber: null,
    operatingSystem: null,
    symptom: null,
    impact: null,
    sameDayCommitment: null,
    hasWorkaround: null,
    blocksWork: null,
  },
  confidence: 0,
  reason: BUDGET_REASON,
};
