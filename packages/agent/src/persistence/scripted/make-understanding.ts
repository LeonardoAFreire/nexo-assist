import type { Understanding } from '@nexo/contracts';

export function makeUnderstanding(overrides: Partial<Understanding> = {}): Understanding {
  return {
    intent: 'question',
    summary: 'Dúvida sobre VPN com erro 809',
    entities: {
      ticketNumber: null,
      operatingSystem: null,
      symptom: null,
      impact: null,
      sameDayCommitment: null,
      hasWorkaround: null,
      blocksWork: null,
    },
    confidence: 0.9,
    reason: 'pergunta direta sobre VPN',
    ...overrides,
  };
}
