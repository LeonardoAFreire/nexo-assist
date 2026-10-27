import type { PriorityAssessment, PriorityFacts } from '@nexo/contracts';
import type { Clock } from './clock.js';
import type { DeadlinePolicy } from './deadline-policy.js';
import type { PriorityMatrix } from './priority-matrix.js';

export class PriorityAssessor {
  constructor(
    private readonly matrix: PriorityMatrix,
    private readonly deadlines: DeadlinePolicy,
    private readonly clock: Clock,
  ) {}

  assess(facts: PriorityFacts): PriorityAssessment {
    const { priority, rule } = this.matrix.classify(facts);
    const dueAt = this.deadlines.dueAt({ priority, from: this.clock.now() });
    return {
      priority,
      deadline: this.deadlines.deadlineFor(priority),
      dueAt: dueAt.toISOString(),
      rule,
    };
  }
}
