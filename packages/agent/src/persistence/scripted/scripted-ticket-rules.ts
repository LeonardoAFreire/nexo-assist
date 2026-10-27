import type { DuplicateCheck, PriorityAssessment } from '@nexo/contracts';

export type ScriptedTicketRules = {
  duplicateCheck?: Partial<DuplicateCheck>;
  assessment?: Partial<PriorityAssessment>;
};

const DEFAULT_DUPLICATE_CHECK: DuplicateCheck = {
  openMatches: [],
  reopenable: [],
  expiredResolved: [],
  rule: 'sem chamado aberto sobre o mesmo problema: segue para abertura',
};

const DEFAULT_ASSESSMENT: PriorityAssessment = {
  priority: 'medium',
  deadline: { amount: 3, unit: 'business_days' },
  dueAt: '2026-10-29T18:00:00.000Z',
  rule: 'impacto individual sem bloqueio: prioridade média',
};

export function resolveDuplicateCheck(rules: ScriptedTicketRules): DuplicateCheck {
  return { ...DEFAULT_DUPLICATE_CHECK, ...rules.duplicateCheck };
}

export function resolveAssessment(rules: ScriptedTicketRules): PriorityAssessment {
  return { ...DEFAULT_ASSESSMENT, ...rules.assessment };
}
