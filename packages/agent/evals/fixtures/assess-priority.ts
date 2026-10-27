import type {
  PriorityAssessment,
  PriorityDeadline,
  PriorityFacts,
  TicketPriority,
} from '@nexo/contracts';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const HOURS_PER_BUSINESS_DAY = 10;
const GROUP_IMPACTS: PriorityFacts['impact'][] = ['my_team', 'whole_company'];

const DEADLINES: Record<TicketPriority, PriorityDeadline> = {
  critical: { amount: 1, unit: 'clock_hours' },
  high: { amount: 4, unit: 'business_hours' },
  medium: { amount: 3, unit: 'business_days' },
  low: { amount: 5, unit: 'business_days' },
};

function classify(facts: PriorityFacts): { priority: TicketPriority; rule: string } {
  if (facts.blocksWork && GROUP_IMPACTS.includes(facts.impact)) {
    return {
      priority: 'critical',
      rule: 'prioridade crítica: algo está parado para a equipe ou para a empresa',
    };
  }
  if (facts.blocksWork || facts.sameDayCommitment) {
    const reason = facts.blocksWork ? 'impede uma pessoa de trabalhar' : 'há compromisso hoje';
    return { priority: 'high', rule: `prioridade alta: ${reason}` };
  }
  if (facts.kind === 'incident') {
    return { priority: 'medium', rule: 'prioridade média: incidente sem urgência imediata' };
  }
  return { priority: 'low', rule: 'prioridade baixa: pedido sem urgência' };
}

function hoursOf(deadline: PriorityDeadline): number {
  return deadline.unit === 'business_days'
    ? deadline.amount * HOURS_PER_BUSINESS_DAY
    : deadline.amount;
}

export function assessPriority(facts: PriorityFacts, now: Date): PriorityAssessment {
  const { priority, rule } = classify(facts);
  const deadline = DEADLINES[priority];
  const dueAt = new Date(now.getTime() + hoursOf(deadline) * MILLISECONDS_PER_HOUR);
  return { priority, deadline, dueAt: dueAt.toISOString(), rule };
}
