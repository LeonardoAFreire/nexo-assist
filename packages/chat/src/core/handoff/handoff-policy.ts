import type { HandoffReason, SupportLevel, TicketsApi } from '@nexo/contracts';

const SECOND_LEVEL_REASONS: readonly HandoffReason[] = ['critical', 'overdue'];
const CRITICAL_REASON: HandoffReason = 'critical';

export type AssessHandoffInput = {
  reason: HandoffReason;
  handedOffAt: string;
};

export type HandoffAssessment = {
  level: SupportLevel;
  contactDueAt: string;
};

export class HandoffPolicy {
  constructor(private readonly tickets: Pick<TicketsApi, 'contactDeadline'>) {}

  levelFor(reason: HandoffReason): SupportLevel {
    return SECOND_LEVEL_REASONS.includes(reason) ? 'N2' : 'N1';
  }

  async assess(input: AssessHandoffInput): Promise<HandoffAssessment> {
    const contactDueAt = await this.tickets.contactDeadline({
      from: input.handedOffAt,
      critical: input.reason === CRITICAL_REASON,
    });
    return { level: this.levelFor(input.reason), contactDueAt };
  }
}
