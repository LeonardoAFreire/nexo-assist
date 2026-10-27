import type { PriorityFacts, TicketPriority } from '@nexo/contracts';

export type PriorityClassification = {
  priority: TicketPriority;
  rule: string;
};

const GROUP_IMPACTS: PriorityFacts['impact'][] = ['my_team', 'whole_company'];

const CRITICAL_RULE = 'prioridade crítica: algo está parado para a equipe ou para a empresa';
const HIGH_BLOCKED_RULE = 'prioridade alta: impede uma pessoa de trabalhar';
const HIGH_COMMITMENT_RULE = 'prioridade alta: há compromisso hoje';
const HIGH_BLOCKED_COMMITMENT_RULE =
  'prioridade alta: impede uma pessoa de trabalhar e há compromisso hoje';
const MEDIUM_RULE = 'prioridade média: incidente sem urgência imediata';
const LOW_RULE = 'prioridade baixa: pedido sem urgência';

function affectsGroup(facts: PriorityFacts): boolean {
  return GROUP_IMPACTS.includes(facts.impact);
}

function highRule(facts: PriorityFacts): string {
  if (facts.blocksWork && facts.sameDayCommitment) {
    return HIGH_BLOCKED_COMMITMENT_RULE;
  }
  return facts.blocksWork ? HIGH_BLOCKED_RULE : HIGH_COMMITMENT_RULE;
}

export class PriorityMatrix {
  classify(facts: PriorityFacts): PriorityClassification {
    if (facts.blocksWork && affectsGroup(facts)) {
      return { priority: 'critical', rule: CRITICAL_RULE };
    }
    if (facts.blocksWork || facts.sameDayCommitment) {
      return { priority: 'high', rule: highRule(facts) };
    }
    if (facts.kind === 'incident') {
      return { priority: 'medium', rule: MEDIUM_RULE };
    }
    return { priority: 'low', rule: LOW_RULE };
  }
}
