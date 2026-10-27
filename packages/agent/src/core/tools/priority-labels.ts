import type { PriorityAssessment, PriorityDeadline, TicketPriority } from '@nexo/contracts';

const SINGULAR_AMOUNT = 1;

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  critical: 'crítica',
  high: 'alta',
  medium: 'média',
  low: 'baixa',
};

const UNIT_LABELS: Record<PriorityDeadline['unit'], { singular: string; plural: string }> = {
  clock_hours: { singular: 'hora corrida', plural: 'horas corridas' },
  business_hours: { singular: 'hora útil', plural: 'horas úteis' },
  business_days: { singular: 'dia útil', plural: 'dias úteis' },
};

export function priorityLabel(priority: TicketPriority): string {
  return PRIORITY_LABELS[priority];
}

export function deadlineLabel(deadline: PriorityDeadline): string {
  const unit = UNIT_LABELS[deadline.unit];
  const word = deadline.amount === SINGULAR_AMOUNT ? unit.singular : unit.plural;
  return `${deadline.amount} ${word}`;
}

export function describeAssessment(assessment: PriorityAssessment): string {
  const priority = priorityLabel(assessment.priority);
  return `prioridade ${priority}, prazo de ${deadlineLabel(assessment.deadline)}`;
}
